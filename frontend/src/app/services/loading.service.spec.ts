import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with loading false', () => {
    expect(service.loading()).toBe(false);
  });

  it('should set loading to true on start()', () => {
    service.start();
    expect(service.loading()).toBe(true);
  });

  it('should set loading to false after start() and stop()', () => {
    service.start();
    service.stop();
    expect(service.loading()).toBe(false);
  });

  it('should keep loading true with multiple start() calls until all stopped', () => {
    service.start();
    service.start();
    expect(service.loading()).toBe(true);

    service.stop();
    expect(service.loading()).toBe(true);

    service.stop();
    expect(service.loading()).toBe(false);
  });

  it('should not go below 0 on extra stop() calls', () => {
    service.stop();
    service.stop();
    expect(service.loading()).toBe(false);
  });
});
