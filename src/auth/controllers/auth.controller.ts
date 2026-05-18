import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' }) //Documentação dinâmica do swagger
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @Throttle({ short: { ttl: 60000, limit: 5 } }) // Limita a 5 tentativas de login por minuto
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'User registration' })
    @ApiResponse({ status: 201, description: 'Registration successful' })
    @ApiResponse({ status: 400, description: 'Invalid registration data' })
    @Throttle({ medium: { ttl: 60000, limit: 3 } }) // Limita a 3 tentativas de login por minuto
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }
}
