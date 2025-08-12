import { Component, signal } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Punto } from '../clases/Punto';
import { JsonPipe } from '@angular/common';
import { tipos } from '../clases/TiposDeTriangulos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Matematica');
  n !: number;
  cantTriangulos: number = 0;
  tipo1 : string = "";
  tipo2 : string = "";
  matrizPuntos: Punto[] = [];

  private epsilon = 1e-5;

  ejecutar() {
    this.cantTriangulos = 0
    this.matrizPuntos = [];
    this.generarMatrizPuntos();
    this.crearTriangulos();
  }

  generarMatrizPuntos()
  {
    for (let x = 0; x < this.n; x++) {
      for (let y = 0; y < this.n; y++) {
        this.matrizPuntos.push(new Punto(x,y))
      }
    }
  }
  async crearTriangulos()
  {
    for (let index = 0; index < this.matrizPuntos.length - 2; index++) {
      const punto1 = this.matrizPuntos[index];
      for (let index2 = index + 1; index2 < this.matrizPuntos.length - 1; index2++) {
        const punto2 = this.matrizPuntos[index2];
        for (let index3 = index2 + 1; index3 < this.matrizPuntos.length; index3++) {
          const punto3 = this.matrizPuntos[index3];
          if(!(this.esDegenerado(punto1,punto2,punto3)))
          {
            await this.sleep(100)
            console.log(punto1,punto2,punto3)
            this.tipo1 = ""
            this.tipo2 = ""
            this.cantTriangulos += 1
            this.asignarTipo(punto1,punto2,punto3)
          }
        }
      }
    }
  }
  esDegenerado(punto1:Punto,punto2:Punto,punto3:Punto)
  {
    return ((punto1.x == punto2.x && punto2.x == punto3.x) || (punto1.y == punto2.y && punto2.y == punto3.y)) ||
    ((punto2.x - punto1.x)/(punto3.x-punto2.x)) == ((punto2.y-punto1.y)/(punto3.y-punto2.y))
  }
  asignarTipo(p1: Punto, p2: Punto, p3: Punto) {
    const a = this.obtenerLongitudDe(p1, p2);
    const b = this.obtenerLongitudDe(p2, p3);
    const c = this.obtenerLongitudDe(p3, p1);

    const cosA = this.clamp((b * b + c * c - a * a) / (2 * b * c));
    const cosB = this.clamp((a * a + c * c - b * b) / (2 * a * c));
    const cosC = this.clamp((a * a + b * b - c * c) / (2 * a * b));

    const A = Math.acos(cosA) * 180 / Math.PI;
    const B = Math.acos(cosB) * 180 / Math.PI;
    const C = Math.acos(cosC) * 180 / Math.PI;

    if (this.casiIgual(a, b) && this.casiIgual(b, c)) {
      this.tipo1 = "equilátero";
    } else if (this.casiIgual(a, b) || this.casiIgual(b, c) || this.casiIgual(c, a)) {
      this.tipo1 = "isósceles";
    } else {
      this.tipo1 = "escaleno";
    }

    if (this.casiIgual(A, 90) || this.casiIgual(B, 90) || this.casiIgual(C, 90)) {
      this.tipo2 = "rectángulo";
    } else if (A > 90 || B > 90 || C > 90) {
      this.tipo2 = "obtuso";
    } else {
      this.tipo2 = "acutángulo";
    }

    console.log(`Ángulos: A=${A.toFixed(4)}, B=${B.toFixed(4)}, C=${C.toFixed(4)} | Tipo lados: ${this.tipo1}, Tipo ángulo: ${this.tipo2}`);
  }

  obtenerLongitudDe(p1: Punto, p2: Punto): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  clamp(value: number): number {
    return Math.max(-1, Math.min(1, value));
  }

  casiIgual(a: number, b: number): boolean {
    return Math.abs(a - b) < this.epsilon;
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
