'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    Chip,
    Stack,
    Paper,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RepeatIcon from '@mui/icons-material/Repeat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditNoteIcon from '@mui/icons-material/EditNote';

interface HelpDialogProps {
    open: boolean;
    onClose: () => void;
}

const checks = [
    {
        icon: <BlockIcon sx={{ color: '#ef4444' }} />,
        label: '禁止ワード',
        color: '#fef2f2',
        border: '#fecaca',
        description: '設定した「使ってはいけない言葉」が文章中に含まれていないかをチェックします。',
        example: '例：「ございます」「思われます」など媒体ごとのNGワード',
    },
    {
        icon: <RepeatIcon sx={{ color: '#f59e0b' }} />,
        label: '文末連続',
        color: '#fffbeb',
        border: '#fde68a',
        description: '「〜です。〜です。〜です。」のように、同じ文末が3回以上連続していないかを確認します。読み手にリズムの単調さを感じさせないための指摘です。',
        example: '例：「…便利です。…大切です。…重要です。」→ 連続3回で警告',
    },
    {
        icon: <WarningAmberIcon sx={{ color: '#f59e0b' }} />,
        label: '表記ゆれ（ルールベース）',
        color: '#fffbeb',
        border: '#fde68a',
        description: 'あらかじめ設定した「NG表記 → OK表記」のルール表に照らし合わせてチェックします。デフォルトでは97件の表記ルール（CSVの内容）が登録されています。',
        example: '例：「出来る→できる」「データー→データ」「シュミレーション→シミュレーション」',
    },
    {
        icon: <AutoAwesomeIcon sx={{ color: '#3b82f6' }} />,
        label: '表記ゆれ（動的検知）',
        color: '#eff6ff',
        border: '#bfdbfe',
        description: 'ルールを登録していなくても、同じ文章内で「コンピュータ」と「コンピューター」のように混在するカタカナ語を自動で検知します。ルールがなくてもゆれを発見できます。',
        example: '例：同一テキスト内で「サーバ」と「サーバー」が混在→両方をinfo（青）で指摘',
    },
];

export default function HelpDialog({ open, onClose }: HelpDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                <EditNoteIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">このツールについて</Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                {/* Overview */}
                <Box sx={{ mb: 3, p: 2.5, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#0369a1' }}>
                        🔍 テキスト自動校閲とは？
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.9 }}>
                        ブログ記事・メール・資料などの文章を貼り付けるだけで、<strong>表記ゆれ・禁止ワード・文末のリズム</strong>を瞬時にチェックできる校閲支援ツールです。<br />
                        AIではなく<strong>ルールベースの処理</strong>で動作するため、結果が安定しており、独自のルールも自由にカスタマイズできます。
                    </Typography>
                </Box>

                {/* How to use */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                    📋 使い方（3ステップ）
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    {[
                        { step: '①', title: 'テキストを入力', desc: 'チェックしたい文章を入力エリアに貼り付けます' },
                        { step: '②', title: '校閲を実行', desc: '「✨ 校閲を実行する」ボタンを押します' },
                        { step: '③', title: '結果を確認・修正', desc: '右パネルの指摘を確認し、「適用」で即座に修正できます' },
                    ].map((item) => (
                        <Paper key={item.step} elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="bold" color="primary">{item.step}</Typography>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ my: 0.5 }}>{item.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                        </Paper>
                    ))}
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                {/* Check logic */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                    ⚙️ チェックのロジック（4種類）
                </Typography>
                <Stack spacing={2}>
                    {checks.map((check) => (
                        <Box
                            key={check.label}
                            sx={{ p: 2, borderRadius: 2, bgcolor: check.color, border: `1px solid ${check.border}` }}
                        >
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                {check.icon}
                                <Typography variant="subtitle2" fontWeight="bold">{check.label}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#334155', mb: 0.5, lineHeight: 1.8 }}>
                                {check.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                {check.example}
                            </Typography>
                        </Box>
                    ))}
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                {/* Tips */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                    💡 便利な機能
                </Typography>
                <Stack spacing={1.5}>
                    {[
                        {
                            icon: <AutoFixHighIcon fontSize="small" color="primary" />,
                            title: 'ワンクリック修正',
                            desc: '結果リストの「適用」ボタンを押すと、修正案が即座に本文へ反映されます。',
                        },
                        {
                            icon: <AutoAwesomeIcon fontSize="small" sx={{ color: '#f59e0b' }} />,
                            title: '元に戻す（Undo）',
                            desc: '適用後に画面下部のスナックバーに表示される「元に戻す」ボタンで、修正前の状態に戻せます。',
                        },
                        {
                            icon: <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#22c55e' }} />,
                            title: 'ルールのカスタマイズ',
                            desc: '右上の「ルール設定」から禁止ワードや表記ゆれルールを自由に追加・削除できます。ExcelやCSVからの一括インポートも対応。',
                        },
                    ].map((tip) => (
                        <Box key={tip.title} display="flex" gap={1.5} alignItems="flex-start">
                            <Box sx={{ mt: 0.3 }}>{tip.icon}</Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold">{tip.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{tip.desc}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                {/* Note */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        <strong>⚠️ 注意事項：</strong>本ツールはルールベースで動作するため、文脈を考慮した判断は行いません。あくまで「チェックの補助ツール」として活用し、最終的な判断は執筆者ご自身で行ってください。入力されたテキストはサーバーに送信されず、すべてブラウザ内で処理されます。
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="contained" disableElevation sx={{ borderRadius: 4, px: 3 }}>
                    閉じる
                </Button>
            </DialogActions>
        </Dialog>
    );
}
