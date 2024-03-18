import { FocusMonitor } from '@angular/cdk/a11y';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  OnDestroy,
  Optional,
  Output,
  Self,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NgControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { OnInit } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  CustomComponentArgs,
  CustomDataComponent,
} from '@remult/angular/interfaces';

@Component({
  selector: 'app-custom-time-input',
  templateUrl: './custom-time-input.component.html',
  styleUrls: ['./custom-time-input.component.scss'],
  providers: [
    { provide: MatFormFieldControl, useExisting: CustomTimeInputComponent },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatFormFieldControl),
      multi: true,
    },
  ],
})
export class CustomTimeInputComponent implements AfterViewInit, OnDestroy {
  static nextId: number = 0;

  private _disabled: boolean = false;
  private _focused: boolean = false;
  private _placeholder: string = '';
  private _required: boolean = false;
  private destroy: Subject<void> = new Subject();

  hours = [
    '--',
    ...[
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23,
    ].map((x) => x.toString().padStart(2, '0')),
  ];
  hour = '--';
  minutes = '--';

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  now() {
    const d = new Date();
    this.ngModel =
      d.getHours().toString().padStart(2, '0') +
      ':' +
      d.getMinutes().toString().padStart(2, '0');
  }
  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get ngModel(): string {
    if (this.hour == '--' || this.minutes == '--') return '';
    return (
      this.hour.toString().padStart(2, '0') +
      ':' +
      this.minutes.toString().padStart(2, '0')
    );
  }
  set ngModel(value: string) {
    if (value == '') {
      this.hour = '--';
      this.minutes = '--';
      this.stateChanges.next();
      return;
    }
    const [hour, minutes] = value.split(':').map(Number);
    this.hour = hour.toString().padStart(2, '0');
    let m = minutes - (minutes % 15);
    this.minutes = m.toString().padStart(2, '0');
    if (m != minutes)
      setTimeout(() => {
        this.ngModelChange.emit(this.ngModel);
      }, 10);
    this.stateChanges.next();
  }

  @Output()
  ngModelChange = new EventEmitter<string>();

  @Input()
  get value(): string {
    // const n = this.parts.value

    // if (n.area.length == 3 && n.exchange.length == 3) {
    //   return new PhoneNumber(n.area, n.exchange)
    // }

    return '';
  }
  set value(value: string) {
    this.stateChanges.next();
  }
  writeValue(value: string): void {
    //this.parts.setValue(value, { emitEvent: false })
  }
  registerOnChange(onChange: (value: string | null) => void): void {
    //this.parts.valueChanges.pipe(takeUntil(this.destroy)).subscribe(onChange)
  }

  @HostBinding('attr.aria-describedby')
  describedBy: string = '';
  @HostBinding()
  id = `phone-control-${++CustomTimeInputComponent.nextId}`;
  @HostBinding('class.floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  @ViewChild('area', { read: ElementRef })
  areaRef!: ElementRef<HTMLInputElement>;
  @ViewChild('exchange', { read: ElementRef })
  exchangeRef!: ElementRef<HTMLInputElement>;

  autofilled: boolean = false;
  controlType: string = 'phone';
  get empty(): boolean {
    //const n: PhoneNumber = this.parts.value

    //    return !n.area && !n.exchange
    return false;
  }
  @Input()
  errorState = false;
  get focused(): boolean {
    return this._focused;
  }
  set focused(value: boolean) {
    this._focused = value;
    this.stateChanges.next();
  }

  stateChanges: Subject<void> = new Subject();

  constructor(
    private focusMonitor: FocusMonitor,
    private elementRef: ElementRef<HTMLElement>,

    private autofillMonitor: AutofillMonitor
  ) {}

  ngAfterViewInit(): void {
    this.focusMonitor
      .monitor(this.elementRef.nativeElement, true)
      .subscribe((focusOrigin) => {
        this.focused = !!focusOrigin;
      });
    combineLatest(
      this.observeAutofill(this.areaRef),
      this.observeAutofill(this.exchangeRef)
    )
      .pipe(
        map((autofills) => autofills.some((autofilled) => autofilled)),
        takeUntil(this.destroy)
      )
      .subscribe((autofilled) => (this.autofilled = autofilled));
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
    this.stateChanges.complete();
    this.focusMonitor.stopMonitoring(this.elementRef.nativeElement);
    this.autofillMonitor.stopMonitoring(this.areaRef);
    this.autofillMonitor.stopMonitoring(this.exchangeRef);
  }

  onContainerClick(event: MouseEvent): void {
    if ((event.target as Element).tagName.toLowerCase() !== 'select') {
      this.focusMonitor.focusVia(this.areaRef.nativeElement, 'mouse');
    }
  }

  onTouched(): void {}

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDescribedByIds(ids: string[]): void {
    this.describedBy = ids.join(' ');
  }

  setDisabledState(shouldDisable: boolean): void {
    if (shouldDisable) {
      //this.parts.disable()
    } else {
      //this.parts.enable()
    }

    this.disabled = shouldDisable;
  }

  private observeAutofill(ref: ElementRef): Observable<boolean> {
    return this.autofillMonitor
      .monitor(ref)
      .pipe(map((event) => event.isAutofilled))
      .pipe(startWith(false));
  }
}

@Component({
  template: `<mat-form-field
    appearance="outline"
    class="full-width-form-field dense-form-field"
    *ngIf="args"
  >
    <mat-label>{{ args.settings.caption }}</mat-label>
    <app-custom-time-input
      rows="5"
      #theId
      [(ngModel)]="args.fieldRef.value"
      [errorState]="!!args.fieldRef.error"
    >
    </app-custom-time-input>
    <mat-hint *ngIf="args.fieldRef.error" style="color:red">{{
      args.fieldRef.error
    }}</mat-hint>
  </mat-form-field>`,
})
export class CustomTimeDataControlComponent
  implements OnInit, CustomDataComponent
{
  constructor() {}
  args!: CustomComponentArgs;

  ngOnInit(): void {}
}
