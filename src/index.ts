import * as core from "@actions/core";
import * as github from "@actions/github";
import { writeFileSync } from "fs";

type ManifestData = {
  ref: string;
  commit: string;
  branch: string;
  builds: any;
  srcFilenames: any;
};

type OutputData = {
  "manifest-file": string;
  "release-name": string;
  "bucket-key": string;
  "project-name": string;
};

function cleanBranchName(name: string): string {
  return name.replace(/\//g, "-");
}

function getInputList(name: string): string[] {
  let result: string[] = [];
  const values: string = core.getInput(name);
  values.split(",").forEach((value) => result.push(value.trim()));
  return result;
}

function getSuffix(platform: string): string {
  switch (platform) {
    case "linux":
    case "darwin":
      return "tar.gz";
    case "windows":
      return "zip";
    default:
      return "";
  }
}

function dumpOutput(data: OutputData): void {
  for (const [key, value] of Object.entries(data)) {
    core.setOutput(key, value);
  }
}

async function run(): Promise<void> {
  try {
    const branch = core.getInput("ref-name");
    const cleanRefName = cleanBranchName(branch);
    const ref = core.getInput("ref");
    const commit = core.getInput("commit");
    const bucketDomain = core.getInput("bucket-domain");
    let bucketKey = core.getInput("bucket-key");
    const projectName = core.getInput("project-name");
    const usePrefix = core.getBooleanInput("use-prefix");
    const prefix = core.getInput("prefix");

    const architectures = getInputList("architecture");
    const platforms = getInputList("platform");

    core.info(
      `Received refName=${branch} ref=${ref} commit=${commit} bucketDomain=${bucketDomain}`
    );
    core.info(`Received projectName=${projectName}`);

    const manifestFile = `${cleanRefName}.json`;
    const repository = github.context.repo.repo;
    core.info(`Reading repository=${repository}`);

    if (bucketKey === "") {
      core.debug("`bucket-key` not found. Using `project-name` value instead.");
      bucketKey = projectName;
    }

    let manifestData: ManifestData = {
      ref,
      branch,
      commit,
      srcFilenames: {},
      builds: {},
    };

    if (projectName !== "") {
      core.info(
        `Generating manifest for platform=${JSON.stringify(
          platforms
        )} architecture=${JSON.stringify(architectures)}`
      );

      core.startGroup("Platform manifest data");
      for (const platform of platforms) {
        let suffix = getSuffix(platform);
        for (const arch of architectures) {
          core.debug(`platform=${platform} suffix=${suffix} arch=${arch}`);
          let key = `${platform}-${arch}`;
          let name = `${projectName}-${key}.${suffix}`;
          if (usePrefix) {
            name = `${prefix}-${name}`;
          }
          let url = `https://${bucketDomain}/${bucketKey}/${commit}/${name}`;
          core.info(`key=${key} name=${name} url=${url}`);
          manifestData.srcFilenames[key] = `${name}`;
          manifestData.builds[key] = url;
          core.debug(JSON.stringify(manifestData.builds));
        }
      }
      core.endGroup();
    }

    core.debug(`Generated manifestFile=${manifestFile}`);
    writeFileSync(manifestFile, JSON.stringify(manifestData));
    dumpOutput({
      "manifest-file": manifestFile,
      "project-name": projectName,
      "release-name": commit,
      "bucket-key": bucketKey,
    });
  } catch (err) {
    if (err instanceof Error) core.setFailed(err.message);
  }
}

run();
