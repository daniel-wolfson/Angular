import { AuthenticationService } from 'app/_service/Authentication/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { GeneralService } from 'app/_service/General/general.service';
import { Component, OnInit } from '@angular/core';
import { RoleTypes } from 'app/_service/General/enums';
import { AppConfigService } from 'app/_service/app-config.service';
import { SAGService } from 'app/_service/sag.service';
import { MapService } from 'app/map-manage/map.service';
import { WMSCapabilities } from 'app/map-manage/iMapInterface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  userName: string;
  password: string;
  language: string = "1";
  loading = false;

  constructor(
    private sagService :SAGService,private authservice: AuthenticationService,
    private generalService: GeneralService,
    private router: Router,
    private route: ActivatedRoute,
    private configService: AppConfigService,private mapService: MapService
  ) {
    this.userName = '';
    this.password = '';
    this.language = "1";
    const config = this.configService.config;
    this.language = config.defaultLocale.toLowerCase() === "en" ? "2" : "1";
    localStorage.setItem("language",this.language);
  }

  ngOnInit() {
    const path = this.route.routeConfig.path
    const roleId = this.route.snapshot.queryParams['roleId'];
    const token = this.authservice.getToken();

    const LangExist = localStorage.getItem("language");
    if(LangExist !== null){
      this.language = LangExist;
    }
    else{
      localStorage.setItem("language",this.language);
    }
    this.generalService.SetlanguageVa(this.language);

    if(this.language !== "1"){
      this.generalService.SetGlobalDirection("ltr");
    }
    else{
      this.generalService.SetGlobalDirection("rtl");

    }
    if ((!roleId && path !== "form/:guid") || !token || token === "") {
      this.authservice.logout();
    }

    document.getElementById('spinnerRouter').style.display = 'none';

    //let idf = this.route.snapshot.queryParams['idf'];
    //if (idf) {
    //  this.userName = idf, 
    //  this.password = "123456";
    //  setTimeout(() => {
    //    this.onSubmit(new Event("Idf"))
    //  });
    //}
  }

  async onSubmit(event: any) {
    const btnSubmit = <HTMLInputElement>document.getElementById('btnSubmitContent');
    btnSubmit.disabled = true;
    event.preventDefault();

    this.loading = true;
    await this.authservice.loginAsync(this.userName, this.password, Number(this.language));
    
    try{
      await this.sagService.LoginToSag()
    }
    catch(e){
      console.log(e)
    }
    
    const user = this.authservice.currentUserValue;
    let navigateUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    document.getElementById('spinnerRouter').style.display = null;
    document.getElementById('loginDiv').style.display = 'none';

    if (user.RoleId === RoleTypes.UserEval) { 
      navigateUrl = '/reportExt'
    }

    this.loading = false;
    this.router.navigate([navigateUrl]);

   
  }

  ChangeLang(val){
    localStorage.setItem("language",val);
    this.language = val;
    location.reload();
  }
}
