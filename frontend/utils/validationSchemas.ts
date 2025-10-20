import * as yup from 'yup';
import { POSITIONS, LEAGUES } from '../constants';

// Custom validation for age and DOB consistency
const validateAgeAndDOB = (age: number, dob: string) => {
  if (!dob) return true; // Let required validation handle empty DOB
  
  const birthDate = new Date(dob);
  const today = new Date();
  const calculatedAge = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? calculatedAge - 1 
    : calculatedAge;
  
  return Math.abs(actualAge - age) <= 1; // Allow 1 year difference for edge cases
};

// Custom validation for file size and type
const validateFileSize = (file: File | null, maxSizeMB: number) => {
  if (!file) return true; // Optional files
  return file.size <= maxSizeMB * 1024 * 1024;
};

const validateFileType = (file: File | null, allowedTypes: string[]) => {
  if (!file) return true; // Optional files
  return allowedTypes.includes(file.type);
};

// Phone number validation for international format
const validatePhoneNumber = (phone: string) => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if it's between 7-15 digits (international standard)
  return /^[0-9]{7,15}$/.test(digitsOnly);
};

// Name validation - letters, spaces, hyphens, apostrophes only, no multiple consecutive spaces, each word capitalized
const validateName = (name: string) => {
  const trimmed = name.trim();
  // Check for valid characters and no multiple consecutive spaces
  if (!/^[A-Za-z\s'\-]*$/.test(trimmed) || /\s{2,}/.test(trimmed)) {
    return false;
  }

  // Check if each word (separated by space or hyphen) starts with a capital letter
  const words = trimmed.split(/[\s\-]/).filter(Boolean); // Split by space or hyphen, filter out empty strings
  for (const word of words) {
    if (word.length > 0 && !/^[A-Z]/.test(word)) {
      return false;
    }
  }
  return true;
};

// Nationality validation - letters and spaces only
const validateNationality = (nationality: string) => {
  return /^[A-Za-z\s]+$/.test(nationality.trim());
};

// Previous club validation - letters, spaces, hyphens, apostrophes only
const validatePreviousClub = (club: string) => {
  if (!club) return true; // Optional field
  return /^[A-Za-z\s'\-]*$/.test(club.trim());
};

// Bio validation - sanitized text only, now required
const validateBio = (bio: string) => {
  if (!bio || bio.trim().length === 0) return false; // Now required field
  // Remove potentially harmful characters but allow basic punctuation
  const sanitized = bio.replace(/[<>]/g, '');
  return sanitized.length >= 10 && sanitized.length <= 1000;
};

export const playerRegistrationSchema = yup.object().shape({
  // Personal Information
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .test('valid-name', 'Each word in the name must start with a capital letter. Only letters, spaces, apostrophes, and hyphens are allowed. Multiple consecutive spaces are not allowed.', validateName),
  
  age: yup
    .number()
    .required('Age is required')
    .integer('Age must be a whole number')
    .min(15, 'Registration is only available for players aged 15 and above')
    .max(45, 'Registration is only available for players aged 45 and below')
    .test('age-dob-consistency', 'Age must match your date of birth', function(value) {
      const dob = this.parent.dob;
      return validateAgeAndDOB(value, dob);
    }),
  
  email: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long'),
  
  phone: yup
    .string()
    .required('Phone number is required')
    .test('valid-phone', 'Phone number must be 7-15 digits', validatePhoneNumber),
  
  dob: yup
    .string()
    .required('Date of birth is required')
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test('age-requirement', 'You must be at least 15 years old', function(value) {
      if (!value) return false;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      return actualAge >= 15;
    })
    .test('max-age', 'You must be 45 years old or younger', function(value) {
      if (!value) return false;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      return actualAge <= 45;
    }),
  
  nationality: yup
    .string()
    .required('Nationality is required')
    .max(56, 'Nationality must not exceed 56 characters')
    .test('valid-nationality', 'Nationality can only contain letters and spaces', validateNationality),
  
  // Gaming Information
  position: yup
    .string()
    .required('Preferred position is required')
    .oneOf(POSITIONS, 'Please select a valid position'),
  
  clubId: yup
    .string()
    .required('Preferred club is required')
    .test('valid-club', 'Please select a valid club', function(value) {
      // This will be validated against the clubs list in the component
      return value && value.length > 0;
    }),
  
  previousClub: yup
    .string()
    .max(100, 'Previous club name must not exceed 100 characters')
    .test('valid-previous-club', 'Previous club can only contain letters, spaces, apostrophes, and hyphens', validatePreviousClub),
  
  leaguesPlayed: yup
    .array()
    .of(yup.string().oneOf(LEAGUES, 'Invalid league selected'))
    .min(1, 'Please select at least one league you have played in')
    .test('valid-leagues', 'All selected leagues must be valid', function(value) {
      if (!value || value.length === 0) return false; // Now required field
      return value.every(league => LEAGUES.includes(league));
    }),
  
  // File uploads
  profilePhoto: yup
    .mixed<File>()
    .nullable()
    .test('file-size', 'Profile photo must be smaller than 5MB', function(file) {
      return validateFileSize(file, 5);
    })
    .test('file-type', 'Profile photo must be JPG, PNG, or WebP format', function(file) {
      return validateFileType(file, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    }),
  
  identityCard: yup
    .mixed<File>()
    .required('Identity document is required')
    .test('file-size', 'Identity document must be smaller than 10MB', function(file) {
      return validateFileSize(file, 10);
    })
    .test('file-type', 'Identity document must be PDF, JPG, or PNG format', function(file) {
      return validateFileType(file, ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);
    }),
  
  // Bio
  bio: yup
    .string()
    .required('Bio/Description is required')
    .min(10, 'Bio must be at least 10 characters')
    .max(1000, 'Bio must not exceed 1000 characters')
    .test('valid-bio', 'Bio contains invalid characters', validateBio),
});

export type PlayerRegistrationFormData = yup.InferType<typeof playerRegistrationSchema>;

// Additional validation helpers
export const validateFileUpload = (file: File, field: 'profilePhoto' | 'identityCard') => {
  const errors: string[] = [];
  
  if (field === 'profilePhoto') {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      errors.push('Profile photo must be JPG, PNG, or WebP format');
    }
    if (file.size > 5 * 1024 * 1024) {
      errors.push('Profile photo must be smaller than 5MB');
    }
  } else if (field === 'identityCard') {
    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      errors.push('Identity document must be PDF, JPG, or PNG format');
    }
    if (file.size > 10 * 1024 * 1024) {
      errors.push('Identity document must be smaller than 10MB');
    }
  }
  
  return errors;
};

// Country validation schema for the dropdown
export const countrySchema = yup.object().shape({
  name: yup.string().required(),
  code: yup.string().required(),
});
