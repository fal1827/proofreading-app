'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Box, Chip, IconButton, Tooltip, Button, Stack, Snackbar, Paper, Stepper, Step, StepLabel } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UndoIcon from '@mui/icons-material/Undo';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InputArea from '@/components/Proofreader/InputArea';
import ResultList from '@/components/Proofreader/ResultList';
import HighlightedView from '@/components/Proofreader/HighlightedView';
import SettingsDialog from '@/components/Proofreader/SettingsDialog';
import HelpDialog from '@/components/Proofreader/HelpDialog';
import { analyzeText, getCharacterCount, getCharacterCountNoSpaces, ProofreadingResult, ProofreadingSettings, DEFAULT_SETTINGS } from '@/lib/proofreadingLogic';

export default function Home() {
  const [text, setText] = useState('');
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [results, setResults] = useState<ProofreadingResult[] | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [charCountNoSpaces, setCharCountNoSpaces] = useState(0);
  const [settings, setSettings] = useState<ProofreadingSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [undoSnackbarOpen, setUndoSnackbarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('proofreadingSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    // Chrome拡張機能からのメッセージ待機（サイドパネル用）
    if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
        const messageListener = (message: any) => {
            if (message.type === "PROOFREAD_TEXT" && message.text) {
                const newText = message.text;
                setText(newText);
                setIsEditable(message.isEditable || false);
                const analysisResults = analyzeText(newText, settings);
                setResults(analysisResults);
                setCharCount(getCharacterCount(newText));
                setCharCountNoSpaces(getCharacterCountNoSpaces(newText));
                setIsChecking(true);
                setSelectedResultId(null);
            } else if (message.type === "SYNC_EDITABLE_STATE") {
                setIsEditable(message.isEditable);
            }
        };
        (window as any).chrome.runtime.onMessage.addListener(messageListener);
        return () => (window as any).chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, [settings]);

  const handleCheck = useCallback(() => {
    const analysisResults = analyzeText(text, settings);
    setResults(analysisResults);
    setCharCount(getCharacterCount(text));
    setCharCountNoSpaces(getCharacterCountNoSpaces(text));
    setIsChecking(true);
    setSelectedResultId(null);
  }, [text, settings]);

  const handleEdit = useCallback(() => {
    setIsChecking(false);
    setResults(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isChecking) handleCheck();
      }
      if (e.key === 'Escape' && isChecking) {
        e.preventDefault();
        handleEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChecking, handleCheck, handleEdit]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    setCharCount(getCharacterCount(newText));
    setCharCountNoSpaces(getCharacterCountNoSpaces(newText));
  };

  const handleSaveSettings = (newSettings: ProofreadingSettings) => {
    setSettings(newSettings);
    localStorage.setItem('proofreadingSettings', JSON.stringify(newSettings));
  };

  const handleApplySuggestion = (resultId: string) => {
    if (!results) return;
    const result = results.find(r => r.id === resultId);
    if (!result || !result.suggestion) return;

    // Save previous state for undo capability
    setPreviousText(text);

    const before = text.substring(0, result.index);
    const after = text.substring(result.index + result.length);
    const newText = before + result.suggestion + after;
    setText(newText);

    const newResults = analyzeText(newText, settings);
    setResults(newResults);
    setCharCount(getCharacterCount(newText));
    setCharCountNoSpaces(getCharacterCountNoSpaces(newText));
    setSelectedResultId(null);
    setUndoSnackbarOpen(true);
  };

  const handleUndo = () => {
    if (previousText !== null) {
      setText(previousText);
      const newResults = analyzeText(previousText, settings);
      setResults(newResults);
      setCharCount(getCharacterCount(previousText));
      setCharCountNoSpaces(getCharacterCountNoSpaces(previousText));
      setUndoSnackbarOpen(false);
      setPreviousText(null);
    }
  };

  const handleReflectToPage = () => {
    if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
        (window as any).chrome.runtime.sendMessage({
            type: "REFLECT_TEXT",
            text: text
        });
        alert('元のページに反映しました');
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
        alert('クリップボードにコピーしました');
    });
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const activeStep = !text ? 0 : !isChecking ? 1 : 2;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Clean Iframe Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
            <EditNoteIcon color="primary" sx={{ fontSize: 26 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', fontSize: '1.1rem' }}>
                テキスト自動校閲
            </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="使い方・機能説明">
                <IconButton size="small" onClick={() => setHelpOpen(true)} sx={{ color: '#64748b' }}>
                    <HelpOutlineIcon />
                </IconButton>
            </Tooltip>
            <Button
                variant="text"
                color="inherit"
                size="small"
                onClick={() => setSettingsOpen(true)}
                startIcon={<SettingsIcon />}
                sx={{ color: '#64748b', fontWeight: 'bold' }}
            >
                ルール設定
            </Button>
            <Tooltip title="新しいタブで開く">
                <IconButton size="small" onClick={handleOpenInNewTab} sx={{ color: '#64748b' }}>
                    <span style={{ fontSize: '1.2rem' }}>⛶</span>
                </IconButton>
            </Tooltip>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column', mx: 'auto', width: '100%', maxWidth: '1400px' }}>
        
        {/* Step Navigation */}
        <Box sx={{ mb: 3, display: { xs: 'none', sm: 'block' } }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 'bold', color: '#64748b' } }}>
                <Step><StepLabel>テキストを入力</StepLabel></Step>
                <Step><StepLabel>校閲を実行</StepLabel></Step>
                <Step><StepLabel>結果を確認・修正</StepLabel></Step>
            </Stepper>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, flexGrow: 1, overflow: 'hidden' }}>
            
            {/* Left Column: Editor pane */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '500px' }}>
                <Paper elevation={0} sx={{ flexGrow: 1, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
                    
                    {/* Editor Toolbar */}
                    <Box sx={{ p: 1.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f1f5f9' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={`文字: ${charCount}`} size="small" sx={{ bgcolor: '#e2e8f0', color: '#334155', fontWeight: 'bold' }} />
                            <Chip label={`(除空白: ${charCountNoSpaces})`} size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#cbd5e1' }} />
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            {isEditable ? (
                                <Button size="small" variant="outlined" onClick={handleReflectToPage} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                                    ページへ反映
                                </Button>
                            ) : null}
                            <Button size="small" variant="outlined" onClick={handleCopyToClipboard} startIcon={<ContentCopyIcon />} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                                コピー
                            </Button>
                        </Stack>
                    </Box>

                    {/* Editor / Highlight body */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {isChecking && results ? (
                            <HighlightedView
                                text={text}
                                results={results}
                                selectedResultId={selectedResultId}
                                onSelectResult={setSelectedResultId}
                            />
                        ) : (
                            <InputArea text={text} setText={handleTextChange} />
                        )}
                    </Box>

                    {/* Editor Footer / Primary Action */}
                    <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#fff', textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={isChecking ? handleEdit : handleCheck}
                            color={isChecking ? "inherit" : "primary"}
                            startIcon={isChecking ? <EditNoteIcon /> : <AutoFixHighIcon />}
                            disabled={!text}
                            sx={{ 
                                py: 1.5, 
                                px: { xs: 4, md: 8 }, 
                                borderRadius: 8, 
                                fontWeight: 'bold', 
                                fontSize: '1.1rem',
                                color: isChecking ? '#334155' : '#fff',
                                boxShadow: isChecking ? 'none' : '0 4px 14px 0 rgba(0,118,255,0.39)',
                                '&:hover': {
                                    boxShadow: isChecking ? 'none' : '0 6px 20px rgba(0,118,255,0.23)',
                                    bgcolor: isChecking ? '#e2e8f0' : undefined
                                }
                            }}
                        >
                            {isChecking ? "もう一度編集する" : "✨ 校閲を実行する"}
                        </Button>
                    </Box>
                </Paper>
            </Box>

            {/* Right Column: Result List */}
            {isChecking && results && (
                <Box sx={{ flex: { xs: '1 1 100%', lg: '0 0 420px', xl: '0 0 480px' }, height: { xs: 'auto', lg: '100%' }, maxHeight: { xs: '600px', lg: 'unset' }, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <ResultList
                        results={results}
                        selectedResultId={selectedResultId}
                        onSelectResult={setSelectedResultId}
                        onApplySuggestion={handleApplySuggestion}
                    />
                </Box>
            )}
        </Box>
      </Box>

      {/* Undo Snackbar */}
      <Snackbar
        open={undoSnackbarOpen}
        autoHideDuration={8000}
        onClose={(e, reason) => {
            if (reason === 'clickaway') return;
            setUndoSnackbarOpen(false);
        }}
        message="修正を適用しました"
        action={
          <Button color="secondary" size="small" onClick={handleUndo} startIcon={<UndoIcon />} sx={{ fontWeight: 'bold' }}>
            元に戻す
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      />

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </Box>
  );
}
