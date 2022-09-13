import * as core from "@actions/core";
import * as github from "@actions/github";
import { writeFileSync } from "fs";

type ManifestData = {
  ref: string;
  commit: string;
  branch: string;
  builds: Map<string, string>;
  srcFilenames: Map<string, string>;
};

function cleanBranchName(name: string): string {
  return name.replace(/\//g, "_");
}

function getInputList(name: string): string[] {
  let result: string[] = [];
  const values = core.getInput(name);
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

async function run(): Promise<void> {
  try {
    const branch = core.getInput("ref-name");
    const cleanRefName = cleanBranchName(branch);
    const ref = core.getInput("ref");
    const commit = core.getInput("commit");
    const bucketDomain = core.getInput("bucket-domain");
    const projectName = core.getInput("project-name");
    const architectures = getInputList("architecture");
    const platforms = getInputList("platform");

    core.debug(
      `Received refName=${branch} ref=${ref} commit=${commit} bucketDomain=${bucketDomain}`
    );

    const manifestFile = `${cleanRefName}.json`;
    const repository = github.context.repo.repo;
    core.debug(`Reading repository=${repository}`);

    let manifestData: ManifestData = {
      ref,
      branch,
      commit,
      srcFilenames: new Map<string, string>(),
      builds: new Map<string, string>(),
    };

    if (projectName !== "") {
      for (const platform of platforms) {
        let suffix = getSuffix(platform);
        for (const arch of architectures) {
          let key = `${platform}-${arch}`;
          let name = `livepeer-${projectName}-${key}`;
          let url = `https://${bucketDomain}/${projectName}/${commit}/${name}.${suffix}`;
          manifestData.srcFilenames.set(key, `${name}.${suffix}`);
          manifestData.builds.set(key, url);
        }
      }
    }

    core.debug(`Generated manifestFile=${manifestFile}`);
    writeFileSync(manifestFile, JSON.stringify(manifestData));
    core.setOutput("manifest-file", manifestFile);
  } catch (err) {
    if (err instanceof Error) core.setFailed(err.message);
  }
}

run();
