from django.test import TestCase

# Create your tests here.
from django.test import TestCase

from .accountvalidator import AccountChecker

# unit tests for new account validation functionality 
class AccountValidator(TestCase):

    def testMatchingPassword(self):
        '''
        accountChecker.checkMatchingPassword returns 
        true  iff password == confirmed password
        '''
        accountChecker = AccountChecker("username","dddddddd","abcdefghi7")
        self.assertFalse(accountChecker.checkMatchingPassword())
        accountChecker = AccountChecker("username","4alskdjf45","4alskdjf45")
        self.assertTrue(accountChecker.checkMatchingPassword())

    def testPasswordStrength(self):
        '''
        password strength
        '''
        accountChecker = AccountChecker("username","abcdefghi7","abcdefghi7")
        self.assertTrue(accountChecker.checkPasswordStrength())

    def testCheckLength(self):
        accountChecker = AccountChecker("123d","abcdefghi7","abcdefghi7")
        self.assertFalse(accountChecker.checkLength())
        accountChecker = AccountChecker("gsdfhlf","abcdefghi7","abcdefghi7")
        self.assertTrue(accountChecker.checkLength())

    def testCheckPassword(self):
        accountChecker = AccountChecker("username","dsf","dsf")
        self.assertFalse(accountChecker.checkPassword())
        accountChecker = AccountChecker("username","abcdefghi7","abcdefghi7")
        self.assertTrue(accountChecker.checkPassword())

class BacklogModelTests(TestCase):
    
    def test(self):


        
    