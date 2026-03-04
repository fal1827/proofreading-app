'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { ProofreadingResult } from '@/lib/proofreadingLogic';

interface HighlightedViewProps {
    text: string;
    results: ProofreadingResult[];
    selectedResultId: string | null;
    onSelectResult: (id: string) => void;
}

export default function HighlightedView({ text, results, selectedResultId, onSelectResult }: HighlightedViewProps) {
    // Sort results by index to process text sequentially
    const sortedResults = [...results].sort((a, b) => a.index - b.index);

    type Segment = {
        text: string;
        isHighlight: boolean;
        id: string | null;
        type?: 'warning' | 'error' | 'info';
    };

    const segments: Segment[] = [];
    let lastIndex = 0;

    sortedResults.forEach((result) => {
        // Skip results that overlap with the previous highlight
        if (result.index < lastIndex) {
            return;
        }

        // Push text before the highlight
        if (result.index > lastIndex) {
            segments.push({
                text: text.substring(lastIndex, result.index),
                isHighlight: false,
                id: null,
            });
        }

        // Push the highlight
        segments.push({
            text: text.substring(result.index, result.index + result.length),
            isHighlight: true,
            id: result.id,
            type: result.type,
        });

        lastIndex = result.index + result.length;
    });

    // Push remaining text
    if (lastIndex < text.length) {
        segments.push({
            text: text.substring(lastIndex),
            isHighlight: false,
            id: null,
        });
    }

    return (
        <Box
            sx={{
                p: 3,
                bgcolor: '#fff',
                borderRadius: 1,
                boxShadow: 1,
                minHeight: '400px',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                fontFamily: '"Noto Sans JP", sans-serif',
                fontSize: '1.1rem'
            }}
        >
            {segments.map((segment, i) => {
                if (segment.isHighlight) {
                    const isSelected = segment.id === selectedResultId;
                    return (
                        <Typography
                            key={i}
                            component="span"
                            onClick={() => segment.id && onSelectResult(segment.id)}
                            sx={{
                                bgcolor: isSelected ? '#ffeb3b' : '#fff9c4', // Bright yellow if selected, pale yellow otherwise
                                borderBottom: '2px solid',
                                borderColor: segment.type === 'error' ? 'error.main' : 'warning.main',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                '&:hover': {
                                    bgcolor: '#ffeb3b',
                                },
                                fontWeight: isSelected ? 'bold' : 'normal',
                                px: 0.5,
                                borderRadius: '4px'
                            }}
                        >
                            {segment.text}
                        </Typography>
                    );
                }
                return <span key={i}>{segment.text}</span>;
            })}
        </Box>
    );
}
