import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-teacher-home',
  templateUrl: './teacher-home.component.html',
  styleUrls: ['./teacher-home.component.css']
})
export class TeacherHomeComponent implements OnInit {
  userId: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['userId']; // Récupère l'ID de l'utilisateur à partir des paramètres de route
    });
  }

  navigateToProjects() {
    this.router.navigate(['teacher-home', this.userId, 'list-of-projects']);
  }

  navigateToCreateProject() {
    this.router.navigate(['teacher-home', this.userId, 'create-project']);
  }
}

