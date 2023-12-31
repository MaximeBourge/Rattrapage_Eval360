import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { ListOfProjectsComponent } from './list-of-projects/list-of-projects.component';
import { InTheProjectSelectedComponent } from './in-the-project-selected/in-the-project-selected.component';
import { TableauComponent } from './tableau/tableau.component';
import { ListOfStudentsComponent } from './list-of-students/list-of-students.component';
import { MarkThisProjectComponent } from './mark-this-project/mark-this-project.component';
import { Eval360PageComponent } from './eval360-page/eval360-page.component';


const routes: Routes = [
  { path: '', redirectTo: '/signup', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'teacher-home/:userId', component: TeacherHomeComponent },
  { path: 'teacher-home/:userId/create-project', component: CreateProjectComponent },
  { path: 'teacher-home/:userId/list-of-projects', component: ListOfProjectsComponent },
  { path: 'teacher-home/:userId/project/:projectId', component: InTheProjectSelectedComponent },
  { path: 'tableau/:userId/:projectId/:groupId/:studentId/:uniqueVariable', component: TableauComponent },
  { path: 'teacher-home/:userId/project/:projectId/group/:groupId/students', component: ListOfStudentsComponent},
  { path: 'teacher-home/:userId/project/mark/:projectId', component: MarkThisProjectComponent },
  { path: 'eval360/:userId/project/:projectId', component: Eval360PageComponent },

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
