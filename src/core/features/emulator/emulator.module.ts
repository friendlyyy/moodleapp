// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { NgModule, provideAppInitializer } from '@angular/core';

import { CoreEmulatorHelper } from './services/emulator-helper';

// Ionic Native services.
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { Clipboard } from '@awesome-cordova-plugins/clipboard/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { LocalNotifications } from '@awesome-cordova-plugins/local-notifications/ngx';
import { MediaCapture } from '@awesome-cordova-plugins/media-capture/ngx';
import { Zip } from '@features/native/plugins/zip';

// Mock services.
import { CameraMock } from './services/camera';
import { ClipboardMock } from './services/clipboard';
import { FileMock } from './services/file';
import { FileOpenerMock } from './services/file-opener';
import { InAppBrowserMock } from './services/inappbrowser';
import { LocalNotificationsMock } from './services/local-notifications';
import { MediaCaptureMock } from './services/media-capture';
import { ZipMock } from './services/zip';
import { CorePlatform } from '@services/platform';
import { CoreLocalNotifications } from '@services/local-notifications';
import { CoreNative } from '@features/native/services/native';
import { SecureStorageMock } from '@features/emulator/classes/SecureStorage';
import { CoreDbProvider } from '@services/db';
import { CoreDbProviderMock } from '@features/emulator/services/db';

/**
 * This module handles the emulation of Cordova plugins in browser and desktop.
 *
 * It includes the "mock" of all the Ionic Native services that should be supported in browser and desktop,
 * otherwise those features would only work in a Cordova environment.
 *
 * This module also determines if the app should use the original service or the mock. In each of the "useFactory"
 * functions we check if the app is running in mobile or not, and then provide the right service to use.
 */
@NgModule({
    providers: [
        {
            provide: Camera,
            useFactory: (): Camera => CorePlatform.isMobile() ? new Camera() : new CameraMock(),
        },
        {
            provide: Clipboard,
            useFactory: (): Clipboard => CorePlatform.isMobile() ? new Clipboard() : new ClipboardMock(),
        },
        {
            provide: File,
            useFactory: (): File => CorePlatform.isMobile() ? new File() : new FileMock(),
        },
        {
            provide: FileOpener,
            useFactory: (): FileOpener => CorePlatform.isMobile() ? new FileOpener() : new FileOpenerMock(),
        },
        {
            provide: InAppBrowser,
            useFactory: (): InAppBrowser => CorePlatform.isMobile() ? new InAppBrowser() : new InAppBrowserMock(),
        },
        {
            provide: MediaCapture,
            useFactory: (): MediaCapture => CorePlatform.isMobile() ? new MediaCapture() : new MediaCaptureMock(),
        },
        {
            provide: Zip,
            useFactory: (): Zip => CorePlatform.isMobile() ? new Zip() : new ZipMock(),
        },
        {
            provide: LocalNotifications,
            useFactory: (): LocalNotifications => CoreLocalNotifications.isPluginAvailable()
                ? new LocalNotifications()
                : new LocalNotificationsMock(),
        },
        {
            provide: CoreDbProvider,
            useFactory: (): CoreDbProvider => CorePlatform.isMobile() ? new CoreDbProvider() : new CoreDbProviderMock(),
        },
        provideAppInitializer(async () => {
            if (CorePlatform.isMobile()) {
                return;
            }

            CoreNative.registerBrowserMock('secureStorage', new SecureStorageMock());

            await CoreEmulatorHelper.load();
        }),
    ],
})
export class CoreEmulatorModule {}
