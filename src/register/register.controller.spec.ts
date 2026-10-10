import { Test, TestingModule } from '@nestjs/testing';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { RegisterDto } from './dto/register.dto';

describe('RegisterController', () => {
  let controller: RegisterController;

  const mockRegisterService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterController],
      providers: [
        {
          provide: RegisterService,
          useValue: mockRegisterService,
        },
      ],
    }).compile();

    controller = module.get<RegisterController>(RegisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── AC1: Controller delegates to service and returns its result ──────────

  it('AC1 — register() calls service.register with the DTO and returns its result', async () => {
    const dto: RegisterDto = {
      email: 'new@example.com',
      password: 'ValidPass1!',
    };
    const expected = { accessToken: 'tok' };
    mockRegisterService.register.mockResolvedValue(expected);

    const result = await controller.register(dto);

    expect(mockRegisterService.register).toHaveBeenCalledWith(dto);
    expect(mockRegisterService.register).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it('AC1 — register() propagates errors thrown by the service', async () => {
    const dto: RegisterDto = {
      email: 'dup@example.com',
      password: 'ValidPass1!',
    };
    const error = new Error('conflict');
    mockRegisterService.register.mockRejectedValue(error);

    await expect(controller.register(dto)).rejects.toThrow('conflict');
  });
});
