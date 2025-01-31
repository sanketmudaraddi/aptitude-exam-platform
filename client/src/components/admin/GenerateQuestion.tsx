import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, CircularProgress } from '@mui/material';

const GenerateQuestion: React.FC = () => {
    const [query, setQuery] = useState('');
    const [generatedQuestion, setGeneratedQuestion] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/questions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const data = await response.json();
            setGeneratedQuestion(data.question);
        } catch (error) {
            alert('Error generating question. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch('/api/questions/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionText: generatedQuestion,
                    topic: query,
                    difficulty: 'Medium',
                }),
            });
            if (response.ok) {
                alert('Question saved successfully!');
                setQuery('');
                setGeneratedQuestion('');
            } else {
                alert('Error saving question.');
            }
        } catch (error) {
            alert('Error saving question.');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom>
                    Generate Question
                </Typography>
                <TextField
                    fullWidth
                    label="Enter Query"
                    multiline
                    rows={4}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{ mb: 3 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerate}
                    disabled={loading || !query}
                >
                    {loading ? <CircularProgress size={24} /> : 'Generate'}
                </Button>
                {generatedQuestion && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6">Generated Question:</Typography>
                        <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                            {generatedQuestion}
                        </Typography>
                        <Button variant="contained" color="success" onClick={handleSave}>
                            Save Question
                        </Button>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default GenerateQuestion;
