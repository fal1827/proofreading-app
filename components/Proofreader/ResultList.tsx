'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Paper,
    Typography,
    Box,
    Divider,
    Alert,
    Button,
    Chip,
    Stack,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { ProofreadingResult } from '@/lib/proofreadingLogic';
import { AnimatePresence, motion } from 'framer-motion';

type FilterType = 'all' | 'forbidden' | 'repetition' | 'inconsistency';

interface ResultListProps {
    results: ProofreadingResult[];
    selectedResultId: string | null;
    onSelectResult: (id: string) => void;
    onApplySuggestion?: (resultId: string) => void;
}

export default function ResultList({ results, selectedResultId, onSelectResult, onApplySuggestion }: ResultListProps) {
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredResults = useMemo(() => {
        if (filter === 'all') return results;
        return results.filter(r => r.id.startsWith(filter));
    }, [results, filter]);

    const counts = useMemo(() => ({
        forbidden: results.filter(r => r.id.startsWith('forbidden')).length,
        repetition: results.filter(r => r.id.startsWith('repetition')).length,
        inconsistency: results.filter(r => r.id.startsWith('inconsistency')).length,
    }), [results]);

    useEffect(() => {
        if (selectedResultId && itemRefs.current[selectedResultId]) {
            itemRefs.current[selectedResultId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selectedResultId]);

    if (results.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Alert severity="success" sx={{ mt: 2 }}>
                    問題は見つかりませんでした。素晴らしい記事です！
                </Alert>
            </motion.div>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ px: 1 }}>
                チェック結果 ({results.length}件)
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mb: 1, px: 1, flexWrap: 'wrap', gap: 0.5 }}>
                <Chip
                    label="すべて"
                    size="small"
                    color={filter === 'all' ? 'primary' : 'default'}
                    variant={filter === 'all' ? 'filled' : 'outlined'}
                    onClick={() => setFilter('all')}
                />
                {counts.forbidden > 0 && (
                    <Chip
                        label={`禁止ワード (${counts.forbidden})`}
                        size="small"
                        color={filter === 'forbidden' ? 'warning' : 'default'}
                        variant={filter === 'forbidden' ? 'filled' : 'outlined'}
                        onClick={() => setFilter('forbidden')}
                    />
                )}
                {counts.repetition > 0 && (
                    <Chip
                        label={`文末連続 (${counts.repetition})`}
                        size="small"
                        color={filter === 'repetition' ? 'warning' : 'default'}
                        variant={filter === 'repetition' ? 'filled' : 'outlined'}
                        onClick={() => setFilter('repetition')}
                    />
                )}
                {counts.inconsistency > 0 && (
                    <Chip
                        label={`表記ゆれ (${counts.inconsistency})`}
                        size="small"
                        color={filter === 'inconsistency' ? 'warning' : 'default'}
                        variant={filter === 'inconsistency' ? 'filled' : 'outlined'}
                        onClick={() => setFilter('inconsistency')}
                    />
                )}
            </Stack>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                <AnimatePresence>
                    {filteredResults.map((result, index) => {
                        const isSelected = selectedResultId === result.id;
                        return (
                            <motion.div
                                key={result.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                ref={(el) => {
                                    if (el) itemRefs.current[result.id] = el as HTMLDivElement;
                                }}
                            >
                                <React.Fragment>
                                    {index > 0 && <Divider component="li" />}
                                    <ListItem
                                        alignItems="flex-start"
                                        sx={{
                                            py: 2,
                                            bgcolor: isSelected ? '#e3f2fd' : 'transparent',
                                            borderRadius: 1,
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            '&:hover': {
                                                bgcolor: isSelected ? '#e3f2fd' : '#f5f5f5',
                                            }
                                        }}
                                        onClick={() => onSelectResult(result.id)}
                                    >
                                        <Box sx={{ mr: 2, mt: 0.5 }}>
                                            {result.type === 'warning' && <WarningIcon color="warning" />}
                                            {result.type === 'error' && <ErrorIcon color="error" />}
                                            {result.type === 'info' && <InfoIcon color="info" />}
                                        </Box>
                                        <ListItemText
                                            primaryTypographyProps={{ component: 'div' }}
                                            secondaryTypographyProps={{ component: 'div' }}
                                            primary={
                                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {result.message}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.secondary"
                                                        display="block"
                                                        sx={{ mb: 1, fontStyle: 'italic', bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px solid #eee' }}
                                                    >
                                                        該当箇所: 「{result.context}」
                                                    </Typography>
                                                    {result.suggestion && (
                                                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                            <Typography component="span" variant="body2" color="primary" fontWeight="medium">
                                                                修正案: {result.suggestion}
                                                            </Typography>
                                                            {onApplySuggestion && result.id.startsWith('inconsistency') && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="primary"
                                                                    startIcon={<AutoFixHighIcon />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onApplySuggestion(result.id);
                                                                    }}
                                                                    sx={{ ml: 1, textTransform: 'none', fontSize: '0.75rem' }}
                                                                >
                                                                    適用
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    )}
                                                    {result.note && (
                                                        <Alert severity="info" sx={{ mt: 1, py: 0, px: 1, '& .MuiAlert-icon': { py: 0.5 }, '& .MuiAlert-message': { py: 0.5 } }}>
                                                            <Typography variant="caption">
                                                                備考: {result.note}
                                                            </Typography>
                                                        </Alert>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                </React.Fragment>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </List>
        </Paper>
    );
}
