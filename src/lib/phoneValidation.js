// Bangladesh 11-digit phone validation helpers
export const normalizeBDPhone = (input) => {
    if (!input) return '';
    let digits = String(input).replace(/[^\d+]/g, '');
    if (digits.startsWith('+880')) digits = digits.slice(3);
    else if (digits.startsWith('+88')) digits = digits.slice(3);
    else if (digits.startsWith('880')) digits = digits.slice(2);
    else if (digits.startsWith('88')) digits = digits.slice(2);
    return digits.replace(/\D/g, '');
};

export const isValidBDPhone = (phone) => {
    const cleaned = normalizeBDPhone(phone);
    // Standard Bangladesh 11-digit mobile format: 013, 014, 015, 016, 017, 018, 019 followed by 8 digits
    return /^01[3-9]\d{8}$/.test(cleaned);
};

