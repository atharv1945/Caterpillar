from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import sys

def register_error_handlers(app):
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": True, "status_code": exc.status_code, "detail": str(exc.detail)}
        )
        
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"error": True, "status_code": 422, "detail": "Validation Error", "body": exc.errors()}
        )
        
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # Log the real error server-side
        print("Unhandled Exception:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        
        # Safe response to client
        return JSONResponse(
            status_code=500,
            content={"error": True, "status_code": 500, "detail": "Internal server error"}
        )
