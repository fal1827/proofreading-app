'use client';

import React from 'react';
import { TextField, Paper, Typography } from '@mui/material';

interface InputAreaProps {
    text: string;
    setText: (text: string) => void;
}

export default function InputArea({ text, setText }: InputAreaProps) {
    return (
        <Paper elevation={3} sx={{ p: 3, mb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom color="primary">
                原稿入力
            </Typography>
            <TextField
                fullWidth
                multiline
                minRows={10}
                placeholder="ここに原稿を貼り付けてください"
                value={text}
                onChange={(e) => setText(e.target.value)}
                variant="outlined"
                sx={{ mb: 0, bgcolor: '#fafafa', flexGrow: 1, '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
            />
        </Paper>
    );
}
