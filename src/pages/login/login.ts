import { Component } from '@angular/core';
import { AlertController, IonicPage, LoadingController, NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { from } from 'rxjs/observable/from';
import { mergeMap } from 'rxjs/operators';

import { AuthService } from '../../biosys-core/services/auth.service';
import { Dataset, User } from '../../biosys-core/interfaces/api.interfaces';
import { APIService } from '../../biosys-core/services/api.service';
import { StorageService } from '../../shared/services/storage.service';
import { formatAPIError } from '../../biosys-core/utils/functions';
import { ApiResponse } from '../../shared/interfaces/mobile.interfaces';

import { REGO_URL, PROJECT_NAME } from '../../shared/utils/consts';

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
})
export class LoginPage {
    public form: FormGroup;

    public REGO_URL = REGO_URL;

    constructor(public navCtrl: NavController, public navParams: NavParams, private apiService: APIService,
                private authService: AuthService, private storageService: StorageService,
                private formBuilder: FormBuilder, private alertController: AlertController, private loadingCtrl: LoadingController) {
        this.form = this.formBuilder.group({
            'username': ['', Validators.required],
            'password': ['', Validators.required]
        });
    }

    public login() {
        const loading = this.loadingCtrl.create({
            content: 'Logging in'
        });
        loading.present();

        const username = this.form.value['username'];
        const password = this.form.value['password'];

        this.authService.login(username, password).subscribe(() => {
                const params = {
                    project__name: PROJECT_NAME
                };

                this.apiService.getDatasets(params).pipe(
                    mergeMap((datasets: Dataset[]) => from(datasets).pipe(
                        mergeMap((dataset: Dataset) => this.storageService.putDataset(dataset))
                    ))
                ).subscribe();

                this.apiService.getUsers(params).pipe(
                    mergeMap((users: User[]) => this.storageService.putTeamMembers(users))
                ).subscribe();

                loading.dismiss();
                this.navCtrl.setRoot('HomePage');
            },
            (error) => {
                loading.dismiss();
                const apiResponse = formatAPIError(error) as ApiResponse;
                this.alertController.create({
                    title: 'Login Problem',
                    subTitle: !!apiResponse.non_field_errors ? apiResponse.non_field_errors[0] :
                        'There was a problem contacting the server, try again later',
                    buttons: ['Ok']
                }).present();
            }
        );
    }
}
