import { NgModule, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';


import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { AppRoutingModule } from './app-routing.module';
import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';


import { HttpClientModule } from '@angular/common/http';

// Importing Firebase
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { environment } from '../environments/environment';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { ListOfProjectsComponent } from './list-of-projects/list-of-projects.component';
import { InTheProjectSelectedComponent } from './in-the-project-selected/in-the-project-selected.component';
import { TableauComponent } from './tableau/tableau.component';
import { ListOfStudentsComponent } from './list-of-students/list-of-students.component';
import { MarkThisProjectComponent } from './mark-this-project/mark-this-project.component';
import { Eval360PageComponent } from './eval360-page/eval360-page.component';



@Injectable()
export class FirestoreService {
  constructor() {
    firebase.initializeApp(environment.firebaseConfig);
  }
}



@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    SignupComponent,
    LoginComponent,
    HeaderComponent,
    FooterComponent,
    TeacherHomeComponent,
    CreateProjectComponent,
    ListOfProjectsComponent,
    InTheProjectSelectedComponent,
    TableauComponent,
    ListOfStudentsComponent,
    MarkThisProjectComponent,
    Eval360PageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
