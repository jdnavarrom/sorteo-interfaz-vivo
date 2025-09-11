import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../environments/environment';
import {catchError, Observable, throwError} from 'rxjs';
import {sorteoDto} from '../models/sorteo.model';
import {ganadorDto} from '../models/ganador.model';

@Injectable({
  providedIn: 'root'
})
export class SorteoService {

  private http = inject(HttpClient)

  constructor() {
  }

  listarSorteos(): Observable<sorteoDto[]> {
    return this.http.get<sorteoDto[]>(`${environment.endpoint}/sorteo/listar`).pipe(
      catchError((error) => {
        console.error("Error:", error)
        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) {
            return throwError(() => "No se encontraron sorteos disponibles")
          } else {
            return throwError(() => `Error del servidor: ${error.status} ${error.statusText}`)
          }
        }
        return throwError(() => "No se encontraron resultados. Intente nuevamente.")
      }),
    )
  }

  ejecutarSorteo(sorteo: number | undefined): Observable<ganadorDto>  {
    return this.http.get<ganadorDto>(`${environment.endpoint}/sorteo?sorteo=${sorteo}`).pipe(
      catchError((error) => {
        console.error("Error:", error)
        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) {
            return throwError(() => "No se encontraron sorteos disponibles")
          } else {
            return throwError(() => `Error del servidor: ${error.status} ${error.statusText}`)
          }
        }
        return throwError(() => "No se encontraron resultados. Intente nuevamente.")
      }),
    )
  }

}
