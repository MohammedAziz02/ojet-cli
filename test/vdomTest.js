/**
  Copyright (c) 2015, 2021, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/
const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');

const Ojet = require('../ojet');
const util = require('./util');

const testDir = path.resolve('../test_result');
const appDir = path.resolve(testDir, util.VDOM_APP_NAME);

describe('VDOM Test', () => {
  describe('Scaffold', () => {
    it('should have path_mapping.json at root of the app with no baseUrl', () => {
      const pathToPathMappingJson = path.resolve(appDir, 'path_mapping.json');
      const exists = fs.pathExistsSync(pathToPathMappingJson);
      assert.ok(exists, pathToPathMappingJson);
      if (exists) {
        const pathMappingJson = fs.readJSONSync(pathToPathMappingJson);
        assert.ok(!pathMappingJson.baseUrl, 'path_mapping.json has baseUrl');
      }
    });
    it('should have "vdom" on "architecture" field of oraclejetconfig.json', () => {
      const pathToOracleJetConfig = path.resolve(appDir, 'oraclejetconfig.json');
      const oracleJetConfigJson = fs.readJSONSync(pathToOracleJetConfig);
      assert.ok(oracleJetConfigJson.architecture === "vdom", 'application architecture is not "vdom"');
    });
    it('should have custom folder entries in oraclejetconfig.json', () => {
      const pathToOracleJetConfig = path.resolve(appDir, 'oraclejetconfig.json');
      const oracleJetConfigJson = fs.readJSONSync(pathToOracleJetConfig);
      const pathSource = oracleJetConfigJson.paths.source;
      assert.ok(pathSource.javascript === '.', 'javascript entry is not "."');
      assert.ok(pathSource.typescript === '.', 'typescript entry is not "."');
      assert.ok(pathSource.styles === 'styles', 'styles entry is not "styles"');
      assert.ok(pathSource.components === 'components', 'components entry is not "components"');
      assert.ok(pathSource.exchangeComponents === 'exchange_components', 'exchangeComponents entry is not "exchange_components"');
    });
  });

  describe('Component', () => {
    if (!util.noScaffold()) {
      it('should create vcomponent when "ojet create component" is run', async () => {
        const {
          pathToApp,
          sourceFolder,
          typescriptFolder,
          componentsFolder
        } = util.getAppPathData({ appName: util.VDOM_APP_NAME })
        const componentName = 'vcomp-1';
        const pathToComponentTsx = path.join(
          pathToApp,
          sourceFolder,
          typescriptFolder,
          componentsFolder,
          componentName,
          `${componentName}.tsx`
        )
        const ojet = new Ojet({ cwd: pathToApp, logs: false });
        try {
          await ojet.execute({
            task: 'create',
            scope: 'component',
            parameters: [componentName]
          });
          const isVComponent = fs.pathExistsSync(pathToComponentTsx);
          assert.ok(isVComponent, pathToComponentTsx);
        } catch {
          assert.ok(false, 'Error creating component');
        }
      });
    }
  });

  describe('Build', () => {
    if (!util.noBuild()) {
      it('should build vdom app', async () => {
        const ojet = new Ojet({ cwd: util.getAppDir(util.VDOM_APP_NAME), logs: false });
        try {
          await ojet.execute({ task: 'build' });
          assert.ok(true);
        } catch {
          assert.ok(false);
        }
      });
    }
  });

  describe('Build (Release)', () => {
    if (!util.noBuild()) {
      it('should build vdom app', async () => {
        const ojet = new Ojet({ cwd: util.getAppDir(util.VDOM_APP_NAME), logs: false });
        try {
          await ojet.execute({ task: 'build', options: { release: true }});
          assert.ok(true);
        } catch {
          assert.ok(false);
        }
      });
    }
  });

  describe('Webpack', () => {
    describe('Add webpack', () => {
      if (!util.noScaffold()) {
        it('should run "ojet add webpack"', async () => {
          const { pathToApp } = util.getAppPathData({ appName: util.VDOM_APP_NAME });
          const ojet = new Ojet({ cwd: pathToApp, logs: false });
          try {
            await ojet.execute({ 
              task: 'add', 
              parameters: ['webpack']
            });
            assert.ok(true);
          } catch {
            assert.ok(false);
          }
        });
      }
      it('should check that webpack and its dependencies are listed in package.json', () => {
        const { pathToApp } = util.getAppPathData({ appName: util.VDOM_APP_NAME });
        const packageJson = fs.readJsonSync(path.join(pathToApp, 'package.json'));
        util.WEBPACK_DEPENDENCIES.forEach((dependency) => {
          assert.ok(packageJson.devDependencies[dependency], `${dependency} not installed`);
        });
      });
      it('should check that bundler and bundleName properties were added to oraclejetconfig.json', () => {
        const oraclejetConfigJson = util.getOracleJetConfigJson({ appName: util.VDOM_APP_NAME });
        assert.ok(oraclejetConfigJson.bundler === 'webpack', 'bundler not equal to "webpack"');
        assert.ok(oraclejetConfigJson.bundleName === 'bundle.js', 'bundleName not equal to "bundle.js');
      });
    });
    describe('Build debug', () => {
      it('should build in debug mode', async () => {
        const { pathToApp } = util.getAppPathData({ appName: util.VDOM_APP_NAME });
        const ojet = new Ojet({ cwd: pathToApp, logs: false });
        try {
          await ojet.execute({ task: 'build' });
          assert.ok(true);
        } catch {
          assert.ok(false);
        }
      });
    });
    describe('Build release', () => {
      it('should build in release mode', async () => {
        const { pathToApp } = util.getAppPathData({ appName: util.VDOM_APP_NAME });
        const ojet = new Ojet({ cwd: pathToApp, logs: false });
        try {
          await ojet.execute({ task: 'build', options: { release: true }});
          assert.ok(true);
        } catch {
          assert.ok(false);
        }
      });
      it('should have bundle file', () => {
        const { pathToBundleJs } = util.getAppPathData({ appName: util.VDOM_APP_NAME });
        const bundleFileExists = fs.existsSync(pathToBundleJs);
        assert.ok(bundleFileExists, `${pathToBundleJs} does not exist`);
      });
      it('should not load require.js in index.html', () => {
        const { pathToIndexHtml } = util.getAppPathData({ appName: util.VDOM_APP_NAME });
        const indexHtmlContent = fs.readFileSync(pathToIndexHtml, { encoding: 'utf-8' });
        const loadsRequireJs = /require\/require\.js'><\/script>/.test(indexHtmlContent);
        assert.ok(!loadsRequireJs, `${pathToIndexHtml} loads require.js`);
      });
    });
  });
});
