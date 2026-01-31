# BoardSar Backend Integration Test Suite

This directory contains a comprehensive integration test suite for the BoardSar backend API.

## Overview

The test suite validates all backend functionality including:
- User registration and authentication
- Board CRUD operations
- JWT middleware and security
- Database operations
- Error handling
- CORS and content-type validation

## Test Structure

### Test Files
- `TestIntegrationBackend.py` - Main integration test suite
- `README_TEST.md` - This documentation file

### Test Categories

#### User Authentication Tests (11 tests)
- `test_01_server_health` - Server health endpoint
- `test_02_user_registration_valid` - Successful user registration
- `test_03_user_registration_duplicate_email` - Duplicate email handling
- `test_04_user_registration_invalid_email` - Invalid email validation
- `test_05_user_registration_weak_password` - Weak password validation
- `test_06_user_login_valid` - Successful user login
- `test_07_user_login_invalid_credentials` - Invalid credentials handling
- `test_08_user_login_wrong_password` - Wrong password handling
- `test_09_user_profile_access` - Profile access with valid token
- `test_10_user_profile_no_token` - Profile access without token
- `test_11_user_profile_invalid_token` - Profile access with invalid token

#### Board CRUD Operations (13 tests)
- `test_20_board_create_authenticated` - Board creation with authentication
- `test_21_board_create_unauthenticated` - Board creation without authentication
- `test_22_board_create_invalid_data` - Board creation with invalid data
- `test_23_board_list_authenticated` - Board listing with authentication
- `test_24_board_list_unauthenticated` - Board listing without authentication
- `test_25_board_get_specific` - Retrieve specific board
- `test_26_board_get_nonexistent` - Retrieve non-existent board
- `test_27_board_get_unauthenticated` - Retrieve board without authentication
- `test_28_board_update_existing` - Update existing board
- `test_29_board_update_nonexistent` - Update non-existent board
- `test_30_board_update_unauthenticated` - Update board without authentication
- `test_31_board_delete_existing` - Delete existing board
- `test_32_board_delete_nonexistent` - Delete non-existent board
- `test_33_board_delete_unauthenticated` - Delete board without authentication

#### Security and Edge Cases (6 tests)
- `test_40_board_access_other_user_board` - Cross-user board access prevention
- `test_41_board_list_other_user_boards` - Cross-user board listing prevention
- `test_42_jwt_token_validation` - JWT token validation
- `test_43_cors_headers` - CORS headers validation
- `test_44_content_type_validation` - Content-type validation

## Prerequisites

### Required Python Packages
```bash
pip install requests pymongo python-dotenv
```

### Environment Configuration
The test suite requires the following environment variables to be set:

```bash
# Server Configuration
TEST_BASE_URL=http://localhost:8080

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/boardsar

# JWT Configuration (optional for tests)
JWT_SECRET=your-jwt-secret-key
```

You can set these in a `.env` file in the backend directory or export them in your shell.

### Backend Server
Ensure the BoardSar backend server is running on the configured port (default: 8080).

## Running Tests

### Basic Execution
```bash
cd backend
source venv/bin/activate  # If using virtual environment
python3 TestIntegrationBackend.py
```

### With Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 TestIntegrationBackend.py
```

### Using pytest (Optional)
```bash
cd backend
python3 -m pytest TestIntegrationBackend.py -v
```

## Test Output

The test suite provides detailed output including:

### Test Progress
- Individual test results (PASS/FAIL)
- Test execution time
- Detailed failure messages with stack traces

### Summary Report
```
📊 Test Summary:
   Tests run: 30
   Failures: 0
   Errors: 0

❌ Failures:
   - test_name: error_details

💥 Errors:
   - test_name: error_details
```

### Cleanup Information
- Number of test users and boards created
- Database cleanup results
- MongoDB connection status

## Test Data Management

### Automatic Cleanup
The test suite automatically cleans up test data from MongoDB after execution:
- Test users are deleted from the `users` collection
- Test boards are deleted from the `boards` collection

### Test Data Generation
- Unique email addresses are generated for each test using timestamps
- Test board data follows the frontend format specification
- All test data is isolated and won't interfere with production data

## Debugging

### Debug Output
The test suite includes debug output for troubleshooting:
- Board ID extraction attempts
- Database query results
- API response details

### Common Issues

#### Connection Errors
```
❌ Cannot connect to server: [Errno 111] Connection refused
```
**Solution**: Ensure the backend server is running on the configured port.

#### MongoDB Connection Issues
```
⚠️  MongoDB connection failed: [Error details]
```
**Solution**: Verify MongoDB URI and ensure MongoDB is running.

#### Authentication Failures
```
❌ Failures:
   - test_user_login_valid: AssertionError: 401 != 200
```
**Solution**: Check JWT secret configuration and middleware implementation.

## Test Configuration

### Customizing Test Parameters
You can modify test parameters in the `BoardSarIntegrationTest` class:

```python
# Test configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:8080')
TIMEOUT = 10  # seconds
TEST_EMAIL_DOMAIN = 'test.example.com'
```

### Adding New Tests
To add new tests, follow this pattern:

```python
def test_new_functionality(self):
    """Test description"""
    # Test implementation
    self.assertEqual(expected, actual)
```

## Integration with CI/CD

### Exit Codes
- `0` - All tests passed
- `1` - One or more tests failed

### Example CI Script
```bash
#!/bin/bash
cd backend
source venv/bin/activate
python3 TestIntegrationBackend.py
exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "❌ Some tests failed"
    exit $exit_code
fi
```

## Best Practices

### Test Isolation
- Each test creates its own test data
- Tests do not depend on each other
- Database is cleaned up after each test run

### Error Handling
- Tests validate both success and failure scenarios
- Proper error messages are verified
- Edge cases are thoroughly tested

### Security Testing
- Authentication is tested for all protected endpoints
- Authorization is validated for cross-user access
- JWT token validation is comprehensive

## Troubleshooting

### Test Failures
1. Check the backend server is running
2. Verify MongoDB connection
3. Review test output for specific error details
4. Check environment variables are properly set

### Performance Issues
- Tests may take 15-30 seconds to complete
- Large test datasets may slow down execution
- Consider running tests in parallel for faster execution

### Database Issues
- Ensure MongoDB has sufficient permissions
- Check database connection limits
- Verify test data cleanup is working properly

## Contributing

When adding new tests:
1. Follow the existing test naming convention
2. Include comprehensive error checking
3. Add appropriate debug output
4. Update this README if new test categories are added
5. Ensure tests pass before submitting changes

## Support

For issues with the test suite:
1. Check the troubleshooting section above
2. Review test output for specific error messages
3. Verify backend implementation matches test expectations
4. Ensure all dependencies are properly installed