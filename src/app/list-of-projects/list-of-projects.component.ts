import { Component, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-list-of-projects',
  templateUrl: './list-of-projects.component.html',
  styleUrls: ['./list-of-projects.component.css']
})
export class ListOfProjectsComponent implements OnInit {
  userId: string = '';
  items: HTMLElement[] = [];
  active: number = 3;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    setTimeout(() => {
      this.items = Array.from(this.elementRef.nativeElement.querySelectorAll('.slider .item'));
      this.loadShow();

      const nextButton = this.elementRef.nativeElement.querySelector('#next');
      const prevButton = this.elementRef.nativeElement.querySelector('#prev');

      nextButton.addEventListener('click', this.nextClick.bind(this));
      prevButton.addEventListener('click', this.prevClick.bind(this));
    });
  }

  loadShow() {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const isActive = i === this.active;

      item.style.transform = isActive ? 'none' : `translateX(${120 * (i - this.active)}px) scale(${1 - 0.2 * Math.abs(i - this.active)}) perspective(16px) rotateY(${isActive ? '0' : (i - this.active > 0 ? '-1' : '1')}deg)`;
      item.style.zIndex = isActive ? '1' : '0';
      item.style.opacity = isActive ? '1' : '0.6';
      item.style.filter = isActive ? 'none' : 'blur(5px)';
    }
  }




  nextClick() {
    this.active = this.active + 1 < this.items.length ? this.active + 1 : this.active;
    this.loadShow();
  }

  prevClick() {
    this.active = this.active - 1 >= 0 ? this.active - 1 : this.active;
    this.loadShow();
  }
}
