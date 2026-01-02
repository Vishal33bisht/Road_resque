import { toast } from 'react-hot-toast';

export const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error
        const message = error.response.data?.detail || 'Something went wrong';
        toast.error(message);
    } else if (error.request) {
        // Request made but no response
        toast.error('Network error. Please check your connection.');
    } else {
        toast.error('An unexpected error occurred.');
    }
    console.error('API Error:', error);
};
