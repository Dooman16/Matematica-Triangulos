import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Punto } from '../clases/Punto';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('Matematica');

  n!: number;
  cantTriangulos = 0;
  tipo1 = "";
  tipo2 = "";
  matrizPuntos: Punto[] = [];
  cantPorTipo: number[] =  new Array(11).fill(0);;//0 isoceles, 1 escaleno,2 agudo, 3 rectangulo, 4 obtuso, 5 isoceles agudo, 6 isoceles rectangulo, 
  // 7 isoceles obtuso, 8 escaleno agudo, 9 escaleno rectangulo, 10 escaleno obtuso, 

  canvasWidthInput = 500;
  canvasHeightInput = 500;
  canvasWidth = 500;
  canvasHeight = 500;

  gridOffSet = 20;
  speed = 5; // triangulos por segundo
  scale = 0;

  @ViewChild('canvasPuntos', { static: true }) fondoRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasTriangulo', { static: true }) frenteRef!: ElementRef<HTMLCanvasElement>;

  ctxFondo!: CanvasRenderingContext2D;
  ctxFrente!: CanvasRenderingContext2D;

  private epsilon = 1e-5;
  private executionToken: object | null = null; // Token de cancelación

  ngOnInit() {
    this.ctxFondo = this.fondoRef.nativeElement.getContext('2d')!;
    this.ctxFrente = this.frenteRef.nativeElement.getContext('2d')!;
  }

  ejecutar() {
    // Crear un nuevo token para esta ejecución
    const token = {};
    this.executionToken = token;

    // Ajustar canvas
    this.canvasWidth = this.canvasWidthInput;
    this.canvasHeight = this.canvasHeightInput;
    this.scale = (this.canvasWidth - 2 * this.gridOffSet) / (this.n - 1);

    this.fondoRef.nativeElement.width = this.canvasWidth;
    this.fondoRef.nativeElement.height = this.canvasHeight;
    this.frenteRef.nativeElement.width = this.canvasWidth;
    this.frenteRef.nativeElement.height = this.canvasHeight;

    // Limpiar
    this.ctxFondo.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctxFrente.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.cantTriangulos = 0;
    this.matrizPuntos = [];
    this.generarMatrizPuntos();
    this.dibujarPuntos();

    // Ejecutar triangulos con token
    this.crearTriangulos(token);
  }

  generarMatrizPuntos() {
    for (let x = 0; x < this.n; x++) {
      for (let y = 0; y < this.n; y++) {
        this.matrizPuntos.push(new Punto(x, y));
      }
    }
  }

  private async crearTriangulos(token: object) {
    for (let i = 0; i < this.matrizPuntos.length - 2; i++) {
      if (this.executionToken !== token) break; // cancelación
      const p1 = this.matrizPuntos[i];
      for (let j = i + 1; j < this.matrizPuntos.length - 1; j++) {
        if (this.executionToken !== token) break;
        const p2 = this.matrizPuntos[j];
        for (let k = j + 1; k < this.matrizPuntos.length; k++) {
          if (this.executionToken !== token) break;
          const p3 = this.matrizPuntos[k];

          if (!this.esDegenerado(p1, p2, p3)) {
            await this.sleep(1000 / this.speed);
            if (this.executionToken !== token) break;

            this.cantTriangulos++;
            this.tipo1 = "";
            this.tipo2 = "";
            this.asignarTipo(p1, p2, p3);
            this.dibujarTriangulo(p1, p2, p3);
          }
        }
      }
    }
  }

  esDegenerado(p1: Punto, p2: Punto, p3: Punto) {
    const dx1 = p2.x - p1.x;
    const dy1 = p2.y - p1.y;
    const dx2 = p3.x - p2.x;
    const dy2 = p3.y - p2.y;
    return (dx1 * dy2 === dy1 * dx2); // colinealidad
  }

  asignarTipo(p1: Punto, p2: Punto, p3: Punto) {
    var offset : number = 0
    const a = this.obtenerLongitudDe(p1, p2);
    const b = this.obtenerLongitudDe(p2, p3);
    const c = this.obtenerLongitudDe(p3, p1);

    const cosA = this.clamp((b ** 2 + c ** 2 - a ** 2) / (2 * b * c));
    const cosB = this.clamp((a ** 2 + c ** 2 - b ** 2) / (2 * a * c));
    const cosC = this.clamp((a ** 2 + b ** 2 - c ** 2) / (2 * a * b));

    const A = Math.acos(cosA) * 180 / Math.PI;
    const B = Math.acos(cosB) * 180 / Math.PI;
    const C = Math.acos(cosC) * 180 / Math.PI;
    if(this.casiIgual(a, b) || this.casiIgual(b, c) || this.casiIgual(c, a))
    {
      this.tipo1 = 'isósceles';
      this.cantPorTipo[0] += 1
      offset = 3
    }
    else
    {
      this.tipo1 = 'Escaleno';
      this.cantPorTipo[1] += 1
      offset = 6
    }
    if(this.casiIgual(A, 90) || this.casiIgual(B, 90) || this.casiIgual(C, 90))
    {
      this.tipo2 = 'rectángulo';
      this.cantPorTipo[3] += 1
      this.cantPorTipo[3+offset] += 1
    }
    else if(A > 90 || B > 90 || C > 90)
    {
      this.tipo2 = 'obtuso';
      this.cantPorTipo[4] += 1
      this.cantPorTipo[4+offset] += 1
    }
    else
    {
      this.tipo2 = 'acutángulo';
      this.cantPorTipo[2] += 1
      this.cantPorTipo[2+offset] += 1
    }
  }

  dibujarPuntos() {
    this.ctxFondo.fillStyle = "red";
    for (const p of this.matrizPuntos) {
      this.ctxFondo.beginPath();
      this.ctxFondo.arc(p.x * this.scale + this.gridOffSet, p.y * this.scale + this.gridOffSet, this.scale / 20, 0, Math.PI * 2);
      this.ctxFondo.fill();
    }
  }

  dibujarTriangulo(p1: Punto, p2: Punto, p3: Punto) {
    this.ctxFrente.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctxFrente.beginPath();
    this.ctxFrente.moveTo(p1.x * this.scale + this.gridOffSet, p1.y * this.scale + this.gridOffSet);
    this.ctxFrente.lineTo(p2.x * this.scale + this.gridOffSet, p2.y * this.scale + this.gridOffSet);
    this.ctxFrente.lineTo(p3.x * this.scale + this.gridOffSet, p3.y * this.scale + this.gridOffSet);
    this.ctxFrente.closePath();
    this.ctxFrente.stroke();
  }

  obtenerLongitudDe(p1: Punto, p2: Punto) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  clamp(value: number) {
    return Math.max(-1, Math.min(1, value));
  }

  casiIgual(a: number, b: number) {
    return Math.abs(a - b) < this.epsilon;
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


/*import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Punto } from '../clases/Punto';
import { tipos } from '../clases/TiposDeTriangulos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
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
  canvasHeight : number = 500;
  canvasHeightInput : number = 500;
  canvasWidth : number = 500;
  canvasWidthInput : number = 500;
  gridOffSet : number = 20;
  speed : number = 5; //triangulos por segundo
  fondo: any;
  frente: any;
  ctxFrente: any;
  ctxFondo: any;
  scale: number = 0;


  ngOnInit(){
    this.fondo = document.getElementById('canvasPuntos') as HTMLCanvasElement;
    this.ctxFondo = this.fondo.getContext('2d') as CanvasRenderingContext2D;

    this.frente = document.getElementById('canvasTriangulo') as HTMLCanvasElement;
    this.ctxFrente = this.frente.getContext('2d') as CanvasRenderingContext2D;
  }

  private epsilon = 1e-5;

  ejecutar() {
    this.canvasWidth = this.canvasWidthInput;
    this.canvasHeight = this.canvasHeightInput;
    this.scale = ((this.canvasWidth- 2*this.gridOffSet)/(this.n-1));
    this.ctxFondo.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctxFrente.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.cantTriangulos = 0
    this.matrizPuntos = [];
    this.generarMatrizPuntos();
    this.dibujarPuntos();
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
            await this.sleep(1000/this.speed)
            this.tipo1 = ""
            this.tipo2 = ""
            this.cantTriangulos += 1
            this.asignarTipo(punto1,punto2,punto3)
            this.dibujarTriangulo(punto1, punto2, punto3);
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

    //no pueden haber equilateros, existen

    if (this.casiIgual(a, b) || this.casiIgual(b, c) || this.casiIgual(c, a)) {
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

  dibujarPuntos() {  
    this.ctxFondo.fillStyle = "red";
    for (const p of this.matrizPuntos) {
        this.ctxFondo.beginPath();
        this.ctxFondo.arc(p.x*this.scale+this.gridOffSet, p.y*this.scale+this.gridOffSet, this.scale/20, 0, Math.PI * 2);
        this.ctxFondo.fill();
    }
  }


  dibujarTriangulo(p1: Punto, p2: Punto, p3: Punto) {
    this.ctxFrente.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctxFrente.fillStyle = "red"
    this.ctxFrente.beginPath();
    this.ctxFrente.moveTo(p1.x * this.scale + 20, p1.y * this.scale + 20);
    this.ctxFrente.lineTo(p2.x * this.scale + 20, p2.y * this.scale + 20);
    this.ctxFrente.lineTo(p3.x * this.scale + 20, p3.y * this.scale + 20);
    this.ctxFrente.closePath();
    this.ctxFrente.stroke();
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
*/
