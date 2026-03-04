'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, AppBar, Toolbar, Chip, IconButton, Tooltip, Button, Stack } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import InputArea from '@/components/Proofreader/InputArea';
import ResultList from '@/components/Proofreader/ResultList';
import HighlightedView from '@/components/Proofreader/HighlightedView';
import SettingsDialog from '@/components/Proofreader/SettingsDialog';
import { analyzeText, getCharacterCount, getCharacterCountNoSpaces, ProofreadingResult, ProofreadingSettings, DEFAULT_SETTINGS } from '@/lib/proofreadingLogic';

export default function Home() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<ProofreadingResult[] | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [charCountNoSpaces, setCharCountNoSpaces] = useState(0);
  const [settings, setSettings] = useState<ProofreadingSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('proofreadingSettings');
    if (savedSettings) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter: check
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isChecking) {
          handleCheck();
        }
      }
      // Escape: back to edit
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

  // One-click replace: apply a suggestion from a result
  const handleApplySuggestion = (resultId: string) => {
    if (!results) return;
    const result = results.find(r => r.id === resultId);
    if (!result || !result.suggestion) return;

    // Replace the incorrect text with the suggestion
    const before = text.substring(0, result.index);
    const after = text.substring(result.index + result.length);
    const newText = before + result.suggestion + after;
    setText(newText);

    // Re-run analysis with the updated text
    const newResults = analyzeText(newText, settings);
    setResults(newResults);
    setCharCount(getCharacterCount(newText));
    setCharCountNoSpaces(getCharacterCountNoSpaces(newText));
    setSelectedResultId(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <EditNoteIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            自動校閲Webアプリ
          </Typography>
          <Tooltip title="設定">
            <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, height: 'calc(100vh - 100px)' }}>
          {/* Left Column: Editor / Highlighted View */}
          <Box sx={{
            flex: isChecking ? { xs: '0 0 100%', md: '0 0 66.666%' } : '1 1 100%',
            height: '100%',
            transition: 'all 0.3s',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Stack direction="row" spacing={1}>
                  <Chip label={`文字数: ${charCount}`} color="primary" variant="outlined" />
                  <Chip label={`空白除外: ${charCountNoSpaces}`} variant="outlined" size="small" />
                </Stack>
                {!isChecking && (
                  <Tooltip title="Ctrl+Enter">
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<CheckIcon />}
                      onClick={handleCheck}
                      sx={{ px: 4, py: 1, fontWeight: 'bold' }}
                    >
                      チェック実行
                    </Button>
                  </Tooltip>
                )}
                {isChecking && (
                  <Tooltip title="Escape">
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                    >
                      編集に戻る
                    </Button>
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {isChecking && results ? (
                  <HighlightedView
                    text={text}
                    results={results}
                    selectedResultId={selectedResultId}
                    onSelectResult={setSelectedResultId}
                  />
                ) : (
                  <InputArea
                    text={text}
                    setText={handleTextChange}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Right Column: Results List */}
          {isChecking && (
            <Box sx={{
              flex: { xs: '0 0 100%', md: '0 0 33.333%' },
              height: '100%',
              overflow: 'hidden',
              minWidth: 0
            }}>
              {results && (
                <ResultList
                  results={results}
                  selectedResultId={selectedResultId}
                  onSelectResult={setSelectedResultId}
                  onApplySuggestion={handleApplySuggestion}
                />
              )}
            </Box>
          )}
        </Box>

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSave={handleSaveSettings}
        />
      </Container>
    </Box>
  );
}
