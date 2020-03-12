
class AccountChecker():
    '''
    class that holds methods for validating 
    a newly created account
    '''
    def __init__(self, username, password, confirmedPassword):
        self.username = username
        self.password = password
        self.confirmedPassword = confirmedPassword

    def validateNewAccount(self):
        '''
        checks all requirements for new account
        '''
        if self.checkLength() and self.checkPassword() and self.checkMatchingPassword() and self.checkPasswordStrength():
            return "Error"
                      

    def checkLength(self):
        '''
        returns true iff username >= 5
        '''
        if len(self.username) < 5:
            return False
        return True

    def checkPassword(self):
        '''
        returns true iff password >= 8
        '''
        if len(self.password) < 8:
            return False 
        return True

    def checkMatchingPassword(self):
        '''
        returns true iff password == confirmedPassword
        '''
        if self.password != self.confirmedPassword:
            return False
        return True

    def checkPasswordStrength(self):
        '''
        returns true iff there exists 1 or more
        numbers in password 
        '''
        count = 0
        for c in self.password:
            try:
                int(c)
                count += 1
            except:
                pass

        if count > 0:
            return True
        else:
            return False
                
