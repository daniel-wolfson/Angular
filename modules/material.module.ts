import { BrowserModule } from '@angular/platform-browser';
import { ModuleWithProviders, NgModule } from '@angular/core';

//Angular Material Components
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTreeModule } from '@angular/material/tree';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatTreeModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatToolbarModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    MatSnackBarModule,
    MatButtonToggleModule,

    // MatAutocompleteModule,
    // MatDatepickerModule,
    // MatFormFieldModule,
    // MatRadioModule,
    // MatSliderModule,
    // MatSlideToggleModule,
    // MatMenuModule,
    // MatSidenavModule,
    // MatListModule,
    // MatGridListModule,
    MatTabsModule
    // MatExpansionModule,
    // MatChipsModule,
    // MatIconModule,
    // MatProgressBarModule,
    // MatTooltipModule,
    // MatSortModule,
    // MatPaginatorModule,
  ],
  exports: [
    MatButtonModule,
    MatGridListModule,
    MatButtonToggleModule, 
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatTreeModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatToolbarModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    MatSnackBarModule,    
    // MatAutocompleteModule,
    // MatDatepickerModule,
    // MatRadioModule,
    // MatSliderModule,
    // MatSlideToggleModule,
    // MatMenuModule,
    // MatSidenavModule,
    // MatListModule,
    // MatCardModule,
    MatTabsModule
    // MatExpansionModule,
    // MatProgressBarModule,
    // MatSortModule,
    // MatPaginatorModule,
  ],
  providers: [], 
})
export class AppMaterialModule {}


