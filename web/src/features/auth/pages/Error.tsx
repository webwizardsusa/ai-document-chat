import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router';

const Error = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      textAlign: 'center',
      justifyContent: 'center',
    }}
  >
    <Container maxWidth="md">
      <Typography variant="h1" sx={{ mb: 1 }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 4 }}>
        This page could not be found.
      </Typography>
      <Button color="primary" variant="contained" component={Link} to="/" disableElevation>
        Go Back to Home
      </Button>
    </Container>
  </Box>
);

export default Error;
