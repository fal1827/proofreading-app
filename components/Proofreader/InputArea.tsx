'use client';

import React from 'react';
import { TextField, Box } from '@mui/material';

interface InputAreaProps {
    text: string;
    setText: (text: string) => void;
}

export default function InputArea({ text, setText }: InputAreaProps) {
    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3, flexGrow: 1 }}>
            <TextField
                fullWidth
                multiline
                placeholder="ここにチェックしたい文章を貼り付けて、下部の「✨ 校閲を実行する」ボタンを押してください。"
                value={text}
                onChange={(e) => setText(e.target.value)}
                variant="standard"
                InputProps={{ 
                    disableUnderline: true,
                }}
                sx={{ 
                    flexGrow: 1, 
                    height: '100%',
                    '& .MuiInputBase-root': { 
                        height: '100%', 
                        alignItems: 'flex-start',
                        fontSize: '1.05rem',
                        lineHeight: 1.8,
                        color: '#1e293b'
                    }
                }}
            />
        </Box>
    );
}
