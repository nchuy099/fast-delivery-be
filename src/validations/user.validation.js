const Joi = require('joi');

const userSchema = {
    phoneNumber: Joi.string().pattern(/^\+[0-9]{9,14}$/)
        .messages({ 'string.pattern.base': 'Phone number must start with "+" followed by 9-14 digits' }),
    fullName: Joi.string().min(2).max(100)
        .messages({
            'string.min': 'Full name must be at least 2 characters long',
            'string.max': 'Full name cannot exceed 100 characters'
        }),
    dateOfBirth: Joi.date()
        .messages({ 'date.base': 'Date of birth must be a valid date (YYYY-MM-DD)' }),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHERS')
        .messages({ 'any.only': 'Gender must be one of MALE, FEMALE, or OTHERS' }),
    email: Joi.string().email()
        .messages({ 'string.email': 'Please enter a valid email' }),
    passcode: Joi.string().pattern(/^[0-9]{6}$/)
        .messages({ 'string.pattern.base': 'Passcode must be exactly 6 digits' })
};

const createUserSchema = Joi.object({
    phoneNumber: userSchema.phoneNumber.required()
        .messages({ 'any.required': 'Phone number is required' }),
    fullName: userSchema.fullName.required()
        .messages({ 'any.required': 'Full name is required' }),
    dateOfBirth: userSchema.dateOfBirth,
    gender: userSchema.gender,
    email: userSchema.email.required()
        .messages({ 'any.required': 'Email is required' }),
    passcode: userSchema.passcode.required()
        .messages({ 'any.required': 'Passcode is required' })
});

const updateUserSchema = Joi.object({
    phoneNumber: userSchema.phoneNumber,
    fullName: userSchema.fullName,
    dateOfBirth: userSchema.dateOfBirth,
    gender: userSchema.gender,
    email: userSchema.email,
    passcode: userSchema.passcode
});

module.exports = {
    userSchema,
    createUserSchema,
    updateUserSchema
};