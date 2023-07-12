import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { ListOfProjectsComponent } from './list-of-projects/list-of-projects.component';
import { InTheProjectSelectedComponent } from './in-the-project-selected/in-the-project-selected.component';

const routes: Routes = [
  { path: '', redirectTo: '/signup', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'teacher-home/:userId', component: TeacherHomeComponent },
  { path: 'teacher-home/:userId/create-project', component: CreateProjectComponent },
  { path: 'teacher-home/:userId/list-of-projects', component: ListOfProjectsComponent },
  { path: 'teacher-home/:userId/project/:projectId', component: InTheProjectSelectedComponent },
  // Autres routes de votre application
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
