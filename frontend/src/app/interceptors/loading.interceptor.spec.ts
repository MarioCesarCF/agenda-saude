import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../services/loading.service';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    loadingService = TestBed.inject(LoadingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should set loading true on request and false on response', () => {
    expect(loadingService.loading()).toBe(false);

    httpClient.get('/api/test').subscribe();

    expect(loadingService.loading()).toBe(true);

    const req = httpMock.expectOne('/api/test');
    expect(loadingService.loading()).toBe(true);

    req.flush({});

    expect(loadingService.loading()).toBe(false);
  });

  it('should set loading false even on error response', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(loadingService.loading()).toBe(false);
  });

  it('should handle concurrent requests correctly', () => {
    httpClient.get('/api/test1').subscribe();
    httpClient.get('/api/test2').subscribe();

    expect(loadingService.loading()).toBe(true);

    const req1 = httpMock.expectOne('/api/test1');
    req1.flush({});

    expect(loadingService.loading()).toBe(true);

    const req2 = httpMock.expectOne('/api/test2');
    req2.flush({});

    expect(loadingService.loading()).toBe(false);
  });
});
