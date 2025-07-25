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

import { Component, OnInit } from '@angular/core';
import {
    CoreDataPrivacy,
    CoreDataPrivacyDataRequestType,
    CoreDataPrivacyGetAccessInformationWSResponse,
    CoreDataPrivacyRequest,
} from '@features/dataprivacy/services/dataprivacy';
import { CoreLoadings } from '@services/overlays/loadings';
import { CoreModals } from '@services/overlays/modals';
import { CoreNavigator } from '@services/navigator';
import { CoreScreen } from '@services/screen';
import { CorePromiseUtils } from '@singletons/promise-utils';
import { Translate } from '@singletons';
import { Subscription } from 'rxjs';
import { CoreAlerts } from '@services/overlays/alerts';
import { CoreSharedModule } from '@/core/shared.module';

/**
 * Page to display the main data privacy page.
 */
@Component({
    selector: 'page-core-data-privacy-main',
    templateUrl: 'main.html',
    styleUrl: 'main.scss',
    imports: [
        CoreSharedModule,
    ],
})
export default class CoreDataPrivacyMainPage implements OnInit {

    accessInfo?: CoreDataPrivacyGetAccessInformationWSResponse;
    requests: CoreDataPrivacyRequestToDisplay[] = [];
    loaded = false;
    isTablet = false;
    layoutSubscription?: Subscription;

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        this.isTablet = CoreScreen.isTablet;

        this.layoutSubscription = CoreScreen.layoutObservable.subscribe(() => {
            this.isTablet = CoreScreen.isTablet;
        });

        await this.fetchContent();

        const createType = CoreNavigator.getRouteNumberParam('createType') as CoreDataPrivacyDataRequestType;

        switch (createType) {
            case CoreDataPrivacyDataRequestType.DATAREQUEST_TYPE_EXPORT:
                if (this.accessInfo?.cancreatedatadownloadrequest) {
                    this.newRequest(createType);
                }
                break;
            case CoreDataPrivacyDataRequestType.DATAREQUEST_TYPE_DELETE:
                if (this.accessInfo?.cancreatedatadeletionrequest) {
                    this.newRequest(createType);
                }
                break;
            case CoreDataPrivacyDataRequestType.DATAREQUEST_TYPE_OTHERS:
                if (this.accessInfo?.cancontactdpo) {
                    this.contactDPO();
                }
                break;
        }
    }

    /**
     * Fetch page content.
     */
    async fetchContent(): Promise<void> {
        try {
            this.accessInfo = await CoreDataPrivacy.getAccessInformation();

            this.requests = await CoreDataPrivacy.getDataRequests();

            this.requests.forEach((request) => {
                request.canCancel = CoreDataPrivacy.canCancelRequest(request);
            });
        } catch (error) {
            CoreAlerts.showError(error, { default: 'Error fetching data privacy information' });
        } finally {
            this.loaded = true;
        }
    }

    /**
     * Refresh the page content.
     *
     * @param refresher Refresher.
     */
    async refreshContent(refresher?: HTMLIonRefresherElement): Promise<void> {
        await CorePromiseUtils.ignoreErrors(
            CoreDataPrivacy.invalidateAll(),
        );

        await CorePromiseUtils.ignoreErrors(this.fetchContent());

        refresher?.complete();
    }

    /**
     * Open the contact DPO modal.
     */
    async contactDPO(): Promise<void> {
        const { CoreDataPrivacyContactDPOComponent } =
            await import('@features/dataprivacy/components/contactdpo/contactdpo');

        // Create and show the modal.
        const succeed = await CoreModals.openModal<boolean>({
            component: CoreDataPrivacyContactDPOComponent,
        });

        if (succeed) {
            const modal = await CoreLoadings.show();
            try {
                await this.refreshContent();
            } finally {
                modal.dismiss();
            }
       }
    }

    /**
     * Open the new request modal.
     */
    async newRequest(createType?: CoreDataPrivacyDataRequestType): Promise<void> {
        const { CoreDataPrivacyNewRequestComponent } =
            await import('@features/dataprivacy/components/newrequest/newrequest');

        // Create and show the modal.
        const succeed = await CoreModals.openModal<boolean>({
            component: CoreDataPrivacyNewRequestComponent,
            componentProps: {
                accessInfo: this.accessInfo,
                createType,
            },
        });

        if (succeed) {
            const modal = await CoreLoadings.show();
            try {
                await this.refreshContent();
            } finally {
                modal.dismiss();
            }
        }
    }

    /**
     * Cancel a request.
     *
     * @param requestId Request ID.
     */
    async cancelRequest(requestId: number): Promise<void> {

        try {
            await CoreAlerts.confirm(Translate.instant('core.dataprivacy.cancelrequestconfirmation'), {
                header: Translate.instant('core.dataprivacy.cancelrequest'),
                okText: Translate.instant('core.dataprivacy.cancelrequest'),
            });
        } catch {
            return;
        }

        const modal = await CoreLoadings.show();

        try {
            await CoreDataPrivacy.cancelDataRequest(requestId);

            await this.refreshContent();
        } catch (error) {
            CoreAlerts.showError(error, { default: 'Error cancelling data privacy request' });
        } finally {
            modal.dismiss();
        }
    }

}

type CoreDataPrivacyRequestToDisplay = CoreDataPrivacyRequest & {
    canCancel?: boolean;
};
