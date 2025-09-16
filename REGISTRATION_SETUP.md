# USRA Registration System Setup Guide

## 🚀 Quick Setup Instructions

### 1. Database Setup (Supabase)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Open your project: `ycdsyaenakevtozcomgk`
3. Go to **SQL Editor**
4. Copy and paste the contents of `complete_setup.sql`
5. Click **Run** to execute the script
6. You should see a success message: "✅ SETUP COMPLETED SUCCESSFULLY!"

### 2. Test the Setup

1. Open `test-registration.html` in your browser
2. Run all tests in order:
   - Test Supabase Connection
   - Test Database Schema  
   - Test Storage Buckets
   - Test Registration Form
   - Run Complete Registration Test (optional)
3. All tests should pass ✅

### 3. Use the Registration System

1. Open `registration.html` in your browser
2. Fill out the multi-step registration form
3. Submit the form
4. Check the `schools` table in Supabase to see the registration

## 🔧 What Was Fixed

### Issues Resolved:
1. **Multiple conflicting event handlers** - Cleaned up JavaScript
2. **Database schema mismatches** - Updated schema with all required columns
3. **Storage bucket configuration** - Proper RLS policies and bucket setup
4. **Form validation complexity** - Simplified validation logic
5. **File upload issues** - Fixed bucket names and upload logic

### Key Improvements:
- ✅ Single, clean registration handler
- ✅ Proper error handling and user feedback
- ✅ File upload support (school badge, profile photo, documents)
- ✅ Multi-step form with validation
- ✅ Automatic user creation and authentication
- ✅ Database integration with proper RLS policies

## 📁 Files Modified/Created

### New Files:
- `registration-form-fixed.js` - Clean, working registration system
- `test-registration.html` - Comprehensive testing page
- `REGISTRATION_SETUP.md` - This setup guide

### Modified Files:
- `registration.html` - Updated to use fixed JavaScript
- `complete_setup.sql` - Complete database setup script

## 🧪 Testing

### Manual Testing:
1. Open `registration.html`
2. Fill out all required fields
3. Upload test files (optional)
4. Submit the form
5. Check for success message and redirection

### Automated Testing:
1. Open `test-registration.html`
2. Run all 5 tests
3. All should pass for a working system

## 🔍 Troubleshooting

### Common Issues:

**❌ "Supabase client not initialized"**
- Check that Supabase JS library is loaded
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct

**❌ "Authentication failed"**
- Check if email already exists in auth.users
- Verify password meets requirements (min 6 characters)

**❌ "Database insert error"**
- Run `complete_setup.sql` to fix schema issues
- Check RLS policies are properly configured

**❌ "Storage upload failed"**
- Verify storage buckets exist: `school_badges`, `profile_photos`, `supporting_documents`
- Check storage RLS policies

### Debug Mode:
Open browser console (F12) to see detailed logs:
- ✅ Success messages in green
- ❌ Error messages in red
- 📋 Info messages for debugging

## 🎯 Next Steps

1. **Run the setup** - Execute `complete_setup.sql` in Supabase
2. **Test the system** - Use `test-registration.html`
3. **Customize as needed** - Modify form fields or styling
4. **Deploy** - Your registration system is ready for production!

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Run the test page to identify specific problems
3. Verify database setup with the SQL script
4. Ensure all files are in the correct location

The registration system is now **fully functional** and ready for use! 🎉
