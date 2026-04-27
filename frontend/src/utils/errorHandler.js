import { toast } from 'react-hot-toast';

const prettifyField = (field) => {
    if (!field) return '';
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatValidationDetail = (detail) => {
    if (typeof detail === 'string') {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => {
                if (typeof item === 'string') return item;

                const field = Array.isArray(item?.loc)
                    ? item.loc.filter((part) => part !== 'body').join('.')
                    : item?.loc;
                const message = (item?.msg || 'Invalid value').replace(/^Value error,\s*/i, '');

                return field ? `${prettifyField(field)}: ${message}` : message;
            })
            .join('\n');
    }

    if (detail && typeof detail === 'object') {
        return detail.message || detail.msg || JSON.stringify(detail);
    }

    return '';
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
    if (error.response) {
        return formatValidationDetail(error.response.data?.detail) || fallback;
    }

    if (error.request) {
        return 'Network error. Please check your connection.';
    }

    return error.message || fallback;
};

export const handleApiError = (error) => {
    toast.error(getApiErrorMessage(error, 'An unexpected error occurred.'));
    console.error('API Error:', error);
};
