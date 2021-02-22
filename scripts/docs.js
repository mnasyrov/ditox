/* eslint-disable no-undef */

import fastGlob from 'fast-glob';
import * as fs from 'fs';
import path from 'path';
import shell from 'shelljs';

function exec(command, workDir) {
  if (workDir) {
    shell.pushd('-q', '.');
    shell.cd(workDir);
  }

  shell.exec(command);

  if (workDir) {
    shell.popd('-q');
  }
}

function processPackages() {
  const packagePaths = fastGlob.sync(['packages/*'], {
    onlyDirectories: true,
  });

  console.log('\nCopy LICENSE files...');
  packagePaths.forEach((packagePath) => {
    console.log(`- ${packagePath}`);
    shell.cp('LICENSE', packagePath);
  });

  console.log('\nRun markdown-toc...');
  ['.', ...packagePaths].forEach((packagePath) => {
    const readmePath = path.join(packagePath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      return;
    }

    console.log(`- ${readmePath}`);
    exec(`markdown-toc -i ${readmePath}`);
  });

  console.log('\nRun typedoc...');
  packagePaths.forEach((packagePath) => {
    console.log(`- ${packagePath}`);
    exec(`typedoc`, packagePath);
  });
}

processPackages();
