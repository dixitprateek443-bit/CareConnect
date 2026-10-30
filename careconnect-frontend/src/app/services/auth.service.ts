import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserRole, PatientProfile } from '../models/careconnect.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('careconnect_auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  login(credentials: { email: string; password: string; role: UserRole }): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/login`, credentials).pipe(
      tap((user: User) => {
        localStorage.setItem('careconnect_auth_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  registerPatient(data: Partial<PatientProfile> & { password: string }): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register/patient`, data).pipe(
      tap((user: User) => {
        localStorage.setItem('careconnect_auth_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('careconnect_auth_user');
    this.currentUserSubject.next(null);
  }

  hasRole(role: UserRole): boolean {
    return this.currentUserValue?.role === role;
  }
}
