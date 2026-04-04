'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    Box,
    Typography,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import { ProofreadingSettings } from '@/lib/proofreadingLogic';
import * as XLSX from 'xlsx';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import FileCopyIcon from '@mui/icons-material/FileCopy';

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
    settings: ProofreadingSettings;
    onSave: (newSettings: ProofreadingSettings) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function SettingsDialog({ open, onClose, settings, onSave }: SettingsDialogProps) {
    const [tabValue, setTabValue] = useState(0);
    const [localSettings, setLocalSettings] = useState<ProofreadingSettings>(settings);
    const [newForbiddenWord, setNewForbiddenWord] = useState('');
    const [newIncorrect, setNewIncorrect] = useState('');
    const [newCorrect, setNewCorrect] = useState('');
    const [newNote, setNewNote] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [sheetUrl, setSheetUrl] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    
    // Additional state for new features
    const [forbiddenSearch, setForbiddenSearch] = useState('');
    const [ruleSearch, setRuleSearch] = useState('');
    const [presets, setPresets] = useState<{name: string, settings: ProofreadingSettings}[]>([]);
    const [newPresetName, setNewPresetName] = useState('');

    useEffect(() => {
        if (open) {
            setLocalSettings(settings);
            setImportError(null);
            setImportSuccess(null);
            
            // Load presets from localStorage
            const savedPresets = localStorage.getItem('proofreadingPresets');
            if (savedPresets) {
                try {
                    setPresets(JSON.parse(savedPresets));
                } catch (e) {
                    console.error('Failed to parse presets', e);
                }
            }
        }
    }, [open, settings]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleAddForbiddenWord = () => {
        if (newForbiddenWord.trim()) {
            setLocalSettings(prev => ({
                ...prev,
                forbiddenWords: [...prev.forbiddenWords, newForbiddenWord.trim()]
            }));
            setNewForbiddenWord('');
        }
    };

    const handleDeleteForbiddenWord = (index: number) => {
        setLocalSettings(prev => ({
            ...prev,
            forbiddenWords: prev.forbiddenWords.filter((_, i) => i !== index)
        }));
    };

    const handleAddInconsistencyRule = () => {
        if (newIncorrect.trim() && newCorrect.trim()) {
            setLocalSettings(prev => ({
                ...prev,
                inconsistencyRules: [...prev.inconsistencyRules, {
                    incorrect: newIncorrect.trim(),
                    correct: newCorrect.trim(),
                    note: newNote.trim()
                }]
            }));
            setNewIncorrect('');
            setNewCorrect('');
            setNewNote('');
        }
    };

    const handleDeleteInconsistencyRule = (index: number) => {
        setLocalSettings(prev => ({
            ...prev,
            inconsistencyRules: prev.inconsistencyRules.filter((_, i) => i !== index)
        }));
    };

    const handleClearForbiddenWords = () => {
        if (window.confirm('禁止ワードをすべて削除してもよろしいですか？')) {
            setLocalSettings(prev => ({
                ...prev,
                forbiddenWords: []
            }));
        }
    };

    const handleClearInconsistencyRules = () => {
        if (window.confirm('表記ゆれルールをすべて削除してもよろしいですか？')) {
            setLocalSettings(prev => ({
                ...prev,
                inconsistencyRules: []
            }));
        }
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    // Import Logic
    const processImportData = (data: Record<string, unknown>[]) => {
        let forbiddenCount = 0;
        let inconsistencyCount = 0;
        const newForbidden: string[] = [];
        const newRules: { incorrect: string; correct: string; note?: string }[] = [];

        data.forEach(row => {
            const keys = Object.keys(row);
            const incorrectKey = keys.find(k => k.includes('NG表記') || k.includes('incorrect') || k.includes('誤'));
            const correctKey = keys.find(k => k.includes('OK表記') || k.includes('correct') || k.includes('正'));
            const noteKey = keys.find(k => k.includes('備考') || k.includes('note') || k.includes('メモ'));

            if (incorrectKey && correctKey) {
                const incorrect = String(row[incorrectKey]).trim();
                const correct = String(row[correctKey]).trim();
                const note = noteKey ? String(row[noteKey]).trim() : undefined;

                if (incorrect && correct) {
                    newRules.push({ incorrect, correct, note });
                    inconsistencyCount++;
                }
            } else if (incorrectKey && !correctKey) {
                const word = String(row[incorrectKey]).trim();
                if (word) {
                    newForbidden.push(word);
                    forbiddenCount++;
                }
            }
        });

        if (forbiddenCount === 0 && inconsistencyCount === 0) {
            setImportError('有効なデータが見つかりませんでした。「NG表記」「OK表記」という列名が含まれているか確認してください。');
            return;
        }

        setLocalSettings(prev => ({
            ...prev,
            forbiddenWords: [...prev.forbiddenWords, ...newForbidden],
            inconsistencyRules: [...prev.inconsistencyRules, ...newRules]
        }));
        setImportSuccess(`${inconsistencyCount}件の表記ルールと${forbiddenCount}件の禁止ワードを追加しました。`);
    };

    const handleGoogleSheetImport = async () => {
        setImportLoading(true);
        setImportError(null);
        setImportSuccess(null);
        try {
            const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (!match) {
                throw new Error('無効なGoogleスプレッドシートのURLです。');
            }
            const spreadsheetId = match[1];
            const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error('スプレッドシートの読み込みに失敗しました。権限設定（リンクを知っている全員）を確認してください。');
            }
            const csvText = await response.text();

            const workbook = XLSX.read(csvText, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
            processImportData(data);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'インポート中にエラーが発生しました。';
            setImportError(errorMessage);
        } finally {
            setImportLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);
        setImportError(null);
        setImportSuccess(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
                processImportData(data);
            } catch (_err: unknown) {
                setImportError('ファイルの解析に失敗しました。');
            } finally {
                setImportLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSavePreset = () => {
        if (!newPresetName.trim()) return;
        const newPresets = [...presets, { name: newPresetName.trim(), settings: localSettings }];
        setPresets(newPresets);
        localStorage.setItem('proofreadingPresets', JSON.stringify(newPresets));
        setNewPresetName('');
        setImportSuccess(`プリセット「${newPresetName}」を保存しました。`);
    };

    const handleLoadPreset = (preset: {name: string, settings: ProofreadingSettings}) => {
        setLocalSettings(preset.settings);
        setImportSuccess(`プリセット「${preset.name}」を読み込みました。`);
    };

    const handleDeletePreset = (index: number) => {
        const newPresets = presets.filter((_, i) => i !== index);
        setPresets(newPresets);
        localStorage.setItem('proofreadingPresets', JSON.stringify(newPresets));
    };

    const filteredForbiddenWords = localSettings.forbiddenWords.filter(word => 
        word.toLowerCase().includes(forbiddenSearch.toLowerCase())
    );

    const filteredRules = localSettings.inconsistencyRules.filter(rule => 
        rule.incorrect.toLowerCase().includes(ruleSearch.toLowerCase()) || 
        rule.correct.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        (rule.note && rule.note.toLowerCase().includes(ruleSearch.toLowerCase()))
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>校閲設定</DialogTitle>
            <DialogContent dividers>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs" variant="scrollable" scrollButtons="auto">
                    <Tab label="全般" />
                    <Tab label="禁止ワード" />
                    <Tab label="表記ゆれ" />
                    <Tab label="プリセット" />
                    <Tab label="インポート" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Typography variant="h6" gutterBottom>基本動作</Typography>
                    <FormControlLabel
                        control={
                            <Switch 
                                checked={localSettings.enableDynamicCheck !== false} 
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, enableDynamicCheck: e.target.checked }))} 
                            />
                        }
                        label="辞書なしの動的表記ゆれ検知を有効にする"
                    />
                    <Typography variant="body2" color="text.secondary">
                        同じ文章の中に「コンピュータ」と「コンピューター」が混在している場合など、ルールに登録していなくても自動で検知します。
                    </Typography>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Box display="flex" gap={1} mb={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="新しい禁止ワード"
                            value={newForbiddenWord}
                            onChange={(e) => setNewForbiddenWord(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleAddForbiddenWord} startIcon={<AddIcon />}>
                            追加
                        </Button>
                    </Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="禁止ワードを検索..."
                        value={forbiddenSearch}
                        onChange={(e) => setForbiddenSearch(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        <Button size="small" color="error" onClick={handleClearForbiddenWords}>
                            表示中のワードを全削除
                        </Button>
                    </Box>
                    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {filteredForbiddenWords.map((word, index) => {
                            const originalIndex = localSettings.forbiddenWords.indexOf(word);
                            return (
                                <ListItem
                                    key={index}
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteForbiddenWord(originalIndex)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText primary={word} />
                                </ListItem>
                            );
                        })}
                    </List>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Box display="flex" gap={1} mb={2}>
                        <TextField
                            size="small"
                            label="誤（NG表記）"
                            value={newIncorrect}
                            onChange={(e) => setNewIncorrect(e.target.value)}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            size="small"
                            label="正（OK表記）"
                            value={newCorrect}
                            onChange={(e) => setNewCorrect(e.target.value)}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            size="small"
                            label="備考"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            sx={{ flex: 1 }}
                        />
                        <Button variant="contained" onClick={handleAddInconsistencyRule} startIcon={<AddIcon />}>
                            追加
                        </Button>
                    </Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="ルールを検索..."
                        value={ruleSearch}
                        onChange={(e) => setRuleSearch(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        <Button size="small" color="error" onClick={handleClearInconsistencyRules}>
                            表示中のルールを全削除
                        </Button>
                    </Box>
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>誤（NG表記）</TableCell>
                                    <TableCell>正（OK表記）</TableCell>
                                    <TableCell>備考</TableCell>
                                    <TableCell align="right">操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRules.map((rule, idx) => {
                                    const originalIndex = localSettings.inconsistencyRules.indexOf(rule);
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell>{rule.incorrect}</TableCell>
                                            <TableCell>{rule.correct}</TableCell>
                                            <TableCell>{rule.note}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleDeleteInconsistencyRule(originalIndex)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">今の設定を保存</Typography>
                    <Box display="flex" gap={1} mb={4}>
                        <TextField
                            fullWidth
                            size="small"
                            label="プリセット名"
                            placeholder="例：ビジネス用、ブログ用"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                        />
                        <Button variant="contained" color="secondary" onClick={handleSavePreset} startIcon={<SaveIcon />}>
                            保存
                        </Button>
                    </Box>

                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">保存済みプリセット</Typography>
                    {presets.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">保存されたプリセットはありません。</Typography>
                    ) : (
                        <List>
                            {presets.map((preset, index) => (
                                <ListItem
                                    key={index}
                                    divider
                                    secondaryAction={
                                        <Box>
                                            <Button size="small" startIcon={<ContentPasteIcon />} onClick={() => handleLoadPreset(preset)} sx={{ mr: 1 }}>
                                                読み込み
                                            </Button>
                                            <IconButton edge="end" onClick={() => handleDeletePreset(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText 
                                        primary={preset.name} 
                                        secondary={`禁止ワード: ${preset.settings.forbiddenWords.length}件 / 表記ゆれ: ${preset.settings.inconsistencyRules.length}件`} 
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={4}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Googleスプレッドシートから読み込み
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        「リンクを知っている全員」に共有されたスプレッドシートのURLを入力してください。<br />
                        1行目に「NG表記」「OK表記」という列が必要です。「備考」列も読み込めます。
                    </Typography>
                    <Box display="flex" gap={1} mb={4}>
                        <TextField
                            fullWidth
                            size="small"
                            label="スプレッドシートのURL"
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                        />
                        <Button
                            variant="contained"
                            onClick={handleGoogleSheetImport}
                            disabled={importLoading || !sheetUrl}
                            startIcon={importLoading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                        >
                            読み込み
                        </Button>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Excel / CSVファイルから読み込み
                    </Typography>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadFileIcon />}
                    >
                        ファイルを選択
                        <input
                            type="file"
                            hidden
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                        />
                    </Button>

                    {importError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {importError}
                        </Alert>
                    )}
                    {importSuccess && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            {importSuccess}
                        </Alert>
                    )}
                </TabPanel>

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>キャンセル</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    保存して適用
                </Button>
            </DialogActions>
        </Dialog>
    );
}
