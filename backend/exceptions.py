class ValidationError(Exception):
    def __init__(self, message: str):
        self.message = message

class NotFoundError(Exception):
    def __init__(self, message: str):
        self.message = message

class UnauthorizedError(Exception):
    def __init__(self, message: str):
        self.message = message
