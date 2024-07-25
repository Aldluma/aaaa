import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { ServiceService } from '../../service/service.service';
import { NgFor, NgIf } from '@angular/common';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import Swal from 'sweetalert2';
import { FormGroup, FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { emailDomainValidator } from './custom-validators';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-tecnicoslist',
  standalone: true,
  imports: [NgFor, ReactiveFormsModule, FormsModule, NgIf, NgxPaginationModule, ],
  templateUrl: './tecnicoslist.component.html',
  styleUrls: ['./tecnicoslist.component.css']
})
export class TecnicoslistComponent implements OnInit {
  tecnicos: any[] = [];
  filteredTecnicos: any[] = [];
  searchTerm: string = '';
  searchField: string = 'nombre';
  private notyf: Notyf;
  isModalVisible: boolean = false;
  selectedTecnico: any = {};
  updateTecnico: FormGroup;
  mensaje: string = '';
  mensaje2: string = '';

  // Paginado
  currentPage: number = 1;
  itemsPerPage: number = 5; // Cambia este valor según el número de elementos por página que desees mostrar
  totalPages: number = 1;

  constructor(private service: ServiceService, private el: ElementRef, private fb: FormBuilder) {
    this.notyf = new Notyf({
      duration: 2000,
      position: {
        x: 'center',
        y: 'top',
      },
      dismissible: true
    });
    const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'example.com'];
    this.updateTecnico = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.minLength(10)]],
      domicilio: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email, emailDomainValidator(allowedDomains)]]
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isModalVisible && !this.el.nativeElement.contains(event.target)) {
      this.hideModal();
    }
  }

  ngOnInit(): void {
    this.obtenerTecnicos();
  }

  obtenerTecnicos(): void {
    this.service.obtenerTecnicos().subscribe(
      (response) => {
        if (!response) {
          this.notyf.error('Parece que no hay técnicos registrados');
        } else {
          this.tecnicos = response.data;
          this.filteredTecnicos = this.tecnicos.slice(0, this.itemsPerPage); // Inicializa la lista de técnicos filtrados
          this.totalPages = Math.ceil(this.tecnicos.length / this.itemsPerPage);
        }
      },
      (error) => {
        this.notyf.error('Parece que no hay técnicos registrados');
        console.error('Error al obtener técnicos', error);
      }
    );
  }

  showModal(tecnico: any, id: any): void {
    this.selectedTecnico = tecnico;
    this.isModalVisible = true;
    this.updateTecnico.patchValue(tecnico);
  }

  hideModal(): void {
    this.isModalVisible = false;
    this.selectedTecnico = {};
  }

  actualizarTecnico(): void {
    if (this.updateTecnico.valid) {
      const formValues = this.updateTecnico.value;
      const hasChanges = Object.keys(formValues).some(key => formValues[key] !== this.selectedTecnico[key]);

      if (hasChanges) {
        Swal.fire({
          title: '¿Estás seguro?',
          text: '¡Seguro de cambiar los datos del técnico!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, actualizar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.service.actualizarTecnico(this.selectedTecnico.id, formValues).subscribe(
              (response) => {
                this.notyf.success('Datos del técnico actualizados con éxito.');
                this.hideModal();
                this.obtenerTecnicos();
              },
              (error) => {
                this.notyf.error('Error al actualizar los datos del técnico.');
                console.error('Error al actualizar técnico', error);
              }
            );
          } else {
            this.notyf.success('Actualización cancelada.');
            this.hideModal();
          }
        });
      } else {
        this.notyf.error('No se han realizado cambios en los datos del técnico');
      }
    } else {
      this.notyf.error('Revise bien el formulario');
    }
  }

  inabilitar(id: any, estado: any) {
    if (estado == 1) {
      this.mensaje = '¡Seguro de que quiere inhabilitar a este técnico!';
      this.mensaje2 = 'Sí, inhabilitar';
    } else if (estado == 0) {
      this.mensaje = '¡Seguro de que quiere volver a habilitar a este técnico!';
      this.mensaje2 = 'Sí, Habilitar';
    }
    Swal.fire({
      title: '¿Seguro?',
      text: this.mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this.mensaje2,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.inabilitarTec(id).subscribe(
          (response) => {
            this.notyf.success('Estatus Actualizado');
            this.obtenerTecnicos();
            this.mensaje = '';
          },
          (error) => {
            this.notyf.error('Error al realizar la operación');
            this.obtenerTecnicos();
            this.mensaje = '';
          }
        );
      } else {
        this.notyf.success('Se canceló la operación');
        this.mensaje = '';
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim() === '') {
      this.filteredTecnicos = this.tecnicos.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
    } else {
      this.filteredTecnicos = this.tecnicos.filter(tecnico =>
        tecnico[this.searchField].toLowerCase().includes(this.searchTerm.toLowerCase())
      ).slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
    }
  }

  // Función para cambiar la página actual
  changePage(page: number): void {
    this.currentPage = page;
    this.onSearch();
  }

  // Función para ir a la página anterior
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onSearch();
    }
  }

  // Función para ir a la página siguiente
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.onSearch();
    }
  }

  // Función para cambiar el número de elementos por página
  changeItemsPerPage(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    const numericValue = Number(value);

    if (!isNaN(numericValue)) {
      this.itemsPerPage = numericValue;
      this.totalPages = Math.ceil(this.filteredTecnicos.length / this.itemsPerPage);
      this.currentPage = 1; // Opcional: Restablece la página actual a 1
      this.onSearch(); // Aplica el filtro o actualiza la vista según sea necesario
    } else {
      console.error('Valor inválido para itemsPerPage:', value);
    }
  }
}
