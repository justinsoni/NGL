import { playerRegistrationSchema } from '../utils/validationSchemas';

// Test the validation schema
const testValidationSchema = async () => {
    console.log('Testing Player Registration Validation Schema...');

    // Test valid data
    const validData = {
        name: 'John Doe',
        age: 25,
        email: 'john.doe@example.com',
        phone: '1234567890',
        dob: '1998-01-01',
        nationality: 'United States',
        position: 'Forward',
        clubId: '1',
        previousClub: 'Previous Club',
        leaguesPlayed: ['Premier League'],
        bio: 'Test bio',
        profilePhoto: null,
        identityCard: null
    };

    try {
        await playerRegistrationSchema.validate(validData);
        console.log('✅ Valid data passed validation');
    } catch (error) {
        console.error('❌ Valid data failed validation:', error.message);
    }

    // Test invalid data
    const invalidData = {
        name: 'J', // Too short
        age: 10, // Too young
        email: 'invalid-email', // Invalid email format
        phone: '123', // Too short
        dob: '2020-01-01', // Too young
        nationality: '123', // Invalid characters
        position: 'InvalidPosition',
        clubId: '',
        previousClub: '',
        leaguesPlayed: ['InvalidLeague'],
        bio: 'A'.repeat(1001), // Too long
        profilePhoto: null,
        identityCard: null
    };

    try {
        await playerRegistrationSchema.validate(invalidData);
        console.log('❌ Invalid data should have failed validation');
    } catch (error) {
        console.log('✅ Invalid data correctly failed validation:', error.message);
    }

    // Test age and DOB consistency
    const inconsistentData = {
        name: 'John Doe',
        age: 25,
        email: 'john.doe@example.com',
        phone: '1234567890',
        dob: '2010-01-01', // This would make age ~14, inconsistent with age: 25
        nationality: 'United States',
        position: 'Forward',
        clubId: '1',
        previousClub: '',
        leaguesPlayed: [],
        bio: '',
        profilePhoto: null,
        identityCard: null
    };

    try {
        await playerRegistrationSchema.validate(inconsistentData);
        console.log('❌ Inconsistent age/DOB should have failed validation');
    } catch (error) {
        console.log('✅ Inconsistent age/DOB correctly failed validation:', error.message);
    }
};

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    testValidationSchema();
}

export { testValidationSchema };
