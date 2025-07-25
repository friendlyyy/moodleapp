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

import { Component } from '@angular/core';
import { AddonModDataFieldPluginBaseComponent } from '../../../classes/base-field-plugin-component';
import { AddonModDataEntryField } from '@addons/mod/data/services/data';
import { CoreFileHelper } from '@services/file-helper';
import { CoreWSFile } from '@services/ws';
import { ADDON_MOD_DATA_COMPONENT_LEGACY } from '@addons/mod/data/constants';
import { CoreEditorRichTextEditorComponent } from '@features/editor/components/rich-text-editor/rich-text-editor';
import { CoreSharedModule } from '@/core/shared.module';

/**
 * Component to render data number field.
 */
@Component({
    selector: 'addon-mod-data-field-textarea',
    templateUrl: 'addon-mod-data-field-textarea.html',
    imports: [
        CoreSharedModule,
        CoreEditorRichTextEditorComponent,
    ],
})
export class AddonModDataFieldTextareaComponent extends AddonModDataFieldPluginBaseComponent {

    component?: string;
    componentId?: number;

    /**
     * Format value to be shown. Replacing plugin file Urls.
     *
     * @param value Value to replace.
     * @returns Replaced string to be rendered.
     */
    format(value?: Partial<AddonModDataEntryField>): string {
        const files: CoreWSFile[] = (value && <CoreWSFile[]>value.files) || [];

        return value ? CoreFileHelper.replacePluginfileUrls(value.content || '', files) : '';
    }

    /**
     * Initialize field.
     */
    protected init(): void {
        this.component = ADDON_MOD_DATA_COMPONENT_LEGACY;
        this.componentId = this.database?.coursemodule;

        if (this.displayMode) {
            return;
        }

        let text: string | undefined;
        // Check if rich text editor is enabled.
        if (this.editMode) {
            text = this.format(this.value);
        }

        this.addControl(`f_${this.field.id}`, text);
    }

}
