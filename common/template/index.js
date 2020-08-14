/**
  Copyright (c) 2015, 2020, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/
'use strict';

const urlTemplate = require('./url');
const commonTemplate = require('./common');
const npmTemplate = require('./npm');
const localTemplate = require('./local');
const path = require('path');
const util = require('../../util');

const _HYBRID = 'hybrid';
const _WEB = 'web';

const BLANK_TEMPLATE = 'blank';

const _TEMPLATES_NPM_URL = '@oracle/oraclejet-templates@~9.1.0';

const _TEMPLATES = [BLANK_TEMPLATE, `${BLANK_TEMPLATE}-ts`, 'basic', 'basic-ts', 'navbar', 'navbar-ts', 'navdrawer', 'navdrawer-ts'];


module.exports =
{
  handleTemplate: function _handleTemplate(generator, utils, templateDestDirectory) {
    const template = generator.options.template || BLANK_TEMPLATE;
    utils.log(`Processing template: ${template}`);
    const templateHandler = _getHandler(generator, template, templateDestDirectory);
    return commonTemplate.handle(templateHandler, generator.options.namespace);
  }
};

function _getHandler(generator, template, templateDestDirectory) {
  const templateUrl = _toTemplateUrl(template);
  const templateLocalPath = _getLocalFileAbsolutePath(template);

  if (templateUrl) {
    return urlTemplate.handle(generator, templateUrl, templateDestDirectory);
  }

  // Template is an existing local path, but can not point to application itself
  if (templateLocalPath && _TEMPLATES.indexOf(template) === -1) {
    return localTemplate.handle(generator, templateLocalPath, templateDestDirectory);
  }
  const templateSpec = _resolveTemplateSpec(generator, template);
  return npmTemplate.handle(generator, _TEMPLATES_NPM_URL, templateDestDirectory, templateSpec);
}

function _isUrl(url) {
  return /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(url);
}

function _toTemplateUrl(template) {
  if (_isUrl(template)) {
    return template;
  }

  return null;
}

function _resolveTemplateSpec(generator, template) {
  const res = template.split(':');

  let templateName = res[0];
  const templateType = (res.length > 1) ? res[1] : _getGeneratorType(generator.options.namespace);

  if (templateName.endsWith('-ts')) {
    // eslint-disable-next-line no-param-reassign
    generator.options.typescript = true;
  } else if (generator.options.typescript) {
    templateName = `${templateName}-ts`;
  }

  _validateTemplateName(templateName);
  _validateTemplateType(templateType);

  return { name: templateName, type: templateType };
}

function _validateTemplateName(templateName) {
  if (_TEMPLATES.indexOf(templateName) < 0) {
    let templateList = '';
    _TEMPLATES.forEach((value) => {
      templateList += `\n  ${value}`;
    });
    const msg = `\nA URL or one of the following names is expected: ${templateList}`;
    throw new Error(`Invalid template name: ${templateName}. ${msg}`);
  }
}

function _getGeneratorType(generatorNameSpace) {
  return /hybrid/.test(generatorNameSpace) ? _HYBRID : _WEB;
}

function _validateTemplateType(templateType) {
  if (templateType !== _WEB && templateType !== _HYBRID) {
    throw new Error(`Invalid template type: ${templateType}`);
  }
}

function _getLocalFileAbsolutePath(templatePath) {
  const tempPath = (templatePath[0] !== '~') ? templatePath
    : path.join(process.env.HOME, templatePath.slice(1));
  const absolutePath = path.isAbsolute(tempPath) ? tempPath
    : path.resolve(process.cwd(), tempPath);
  return util.fsExistsSync(absolutePath) ? absolutePath : null;
}
