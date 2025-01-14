import {
  Component, ElementRef, HostBinding,
  HostListener, Input, OnDestroy
} from '@angular/core';
import { EditorView } from 'prosemirror-view';
import { Subscription } from 'rxjs';

import { NgxEditorService } from '../../../editor.service';
import { MenuService } from '../menu.service';
import { ToggleCommands } from '../MenuCommands';
import { TBHeadingItems } from '../../../types';

@Component({
  selector: 'ngx-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnDestroy {
  private editorView: EditorView;
  private pluginUpdateSubscription: Subscription;

  @Input() group: string;
  @Input() items: TBHeadingItems[];

  isDropdownOpen = false;

  private activeItems: TBHeadingItems[] = [];
  disabledItems: string[] = [];
  activeItem: string | null;

  constructor(
    private ngxeService: NgxEditorService,
    private menuService: MenuService,
    private el: ElementRef
  ) {
    this.editorView = this.menuService.view;

    this.pluginUpdateSubscription = this.menuService.plugin.update.subscribe((view: EditorView) => {
      this.update(view);
    });
  }

  @HostBinding('class.NgxEditor__Dropdown--Selected') get isSelected(): boolean {
    return Boolean(this.activeItem || this.isDropdownOpen);
  }

  @HostBinding('class.NgxEditor--Disabled') get isDropdownDisabled(): boolean {
    return this.disabledItems.length === this.items.length;
  }

  @HostListener('document:mousedown', ['$event.target']) onDocumentClick(target: Node): void {
    if (!this.el.nativeElement.contains(target) && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  getName(key: string): string {
    return this.ngxeService.locals.get(key);
  }

  toggleDropdown(e: MouseEvent): void {
    e.preventDefault();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onClick(e: MouseEvent, item: TBHeadingItems): void {
    e.preventDefault();

    // consider only left click
    if (e.button !== 0) {
      return;
    }

    const command = ToggleCommands[item];
    const { state, dispatch } = this.editorView;
    command.toggle()(state, dispatch);
    this.isDropdownOpen = false;
  }

  private update = (view: EditorView) => {
    const { state } = view;
    this.activeItems = [];
    this.disabledItems = [];

    this.items.forEach((item: TBHeadingItems) => {
      const command = ToggleCommands[item];
      const isActive = command.isActive(state);

      if (isActive) {
        this.activeItems.push(item);
      }

      if (!command.canExecute(state)) {
        this.disabledItems.push(item);
      }
    });

    if (this.activeItems.length === 1) {
      this.activeItem = this.activeItems[0];
    } else {
      this.activeItem = null;
    }
  }

  ngOnDestroy(): void {
    this.pluginUpdateSubscription.unsubscribe();
  }
}
