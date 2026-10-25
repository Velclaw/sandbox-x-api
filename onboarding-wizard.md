> ## Documentation Index
> Fetch the complete documentation index at: https://docs.qodo.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Set up Qodo with the onboarding wizard

> Connect your Git provider, apply a Review preset, and set up the Agentic Toolbox with the Qodo onboarding wizard. Available for multi-tenant, single-tenant, and on-premises deployments.

The onboarding wizard guides you through the essential setup for getting code reviews from Qodo, from connecting your code to choosing how Qodo reviews it and bringing Qodo into your developers' coding tools. Each step shapes how Qodo reviews your team's pull requests. Once the wizard is complete, Qodo reviews every new pull request automatically. You can change any of your choices later.

> [!NOTE]
>
> Only organization admins see the onboarding wizard. It opens automatically the first time an admin signs in to the Qodo portal. If you aren't an admin, see [Quickstart: From sign-up to your first code review](https://docs.qodo.ai/get-started.md) for the steps that apply to every user.

## The onboarding journey

1
Connect Git

Connect Qodo to the Git provider that hosts your code. [Connect Git →](#step-1-connect-git)

2
Apply review preset

Answer questions about your team and apply the Review preset Qodo builds from your answers. [Apply review preset →](#step-2-apply-review-preset)

3
Get Agentic Toolbox

Share the Agentic Toolbox with your team and install it on your machine. [Get Agentic Toolbox →](#step-3-get-agentic-toolbox)

## Before you begin

Make sure you have:

* **Admin access to your Git provider**: The required permissions differ by Git provider. See [Install Qodo in your Git provider](https://docs.qodo.ai/install-qodo/install.md) to find your provider's installation guide.
* **Node.js 20 or later**: Required only if you install the Agentic Toolbox on your machine during setup. See [Install Qodo Agentic Toolbox with the CLI](https://docs.qodo.ai/agentic-toolbox/cli.md#prerequisites).

## Step 1: Connect Git

**Step 1**

Select the Git provider that hosts your code, then click **Next**. If your Git provider is self-hosted, select the self-hosted option that appears after you select the provider.

![Onboarding wizard first screen showing the left panel and the Git provider selection](https://mintcdn.com/qodo/FIl5leP5_SGjP02f/images/onboarding-wizard/onboarding-wizard-connect-your-git-provider.png?fit=max\&auto=format\&n=FIl5leP5_SGjP02f\&q=85\&s=33ffec37e8dcbbed98e092bbc4b98620)

**Step 2**

Complete the installation wizard for your Git provider. See [Install Qodo in your Git provider](https://docs.qodo.ai/install-qodo/install.md).

**Step 3**

On the **Verify connection** step, Qodo checks the connection to your Git provider. The step shows the connection as loading while Qodo checks it, then as connected or failed. Once connected, it shows how many repositories are connected.

**Step 4**

Click **Next** to continue with the wizard.

Qodo starts building context for your code reviews, and the following processes run automatically in the background:

* [Repository sync](https://docs.qodo.ai/governance/repositories/installations.md): Syncs each connected repository with Qodo.
* [Pull request indexing](https://docs.qodo.ai/governance/repositories/manage-repositories.md#check-repository-pr-history-indexing-status): Indexes each repository's pull request history.
* [Cross-repo discovery](https://docs.qodo.ai/governance/repositories/relationships.md): Finds relationships between your repositories.

Track their progress from **Background activity** in the top-right corner of the portal. If a process needs attention, see [Troubleshoot background processes](https://docs.qodo.ai/governance/troubleshoot-background-processes.md).

> [!TIP]
>
> It's recommended to import your team's existing rules and skills, which lets Qodo enforce your coding standards in its reviews. See [Importing rules and skills](https://docs.qodo.ai/governance/rule-enforcement/building-review-standards#importing-rules-and-skills).

## Step 2: Apply review preset

Qodo builds a Review preset from your answers to a few questions about your team. A Review preset is a set of configuration settings tuned to what your team needs most from code review.

**Step 1**

Answer the questions about your team's priorities and how your team works. Select as many answers as apply, then click **Next**.

**Step 2**

Qodo shows the suggested preset, including what it runs, how it shows findings in pull requests, and what it automates. To use a different preset, select it from the dropdown.

![Onboarding wizard Apply review preset step showing the recommended preset, what it runs, and the Change preset button](https://mintcdn.com/qodo/LKoUOyaVY1qTFNgL/images/onboarding-wizard/onboarding-wizard-apply-preset.png?fit=max\&auto=format\&n=LKoUOyaVY1qTFNgL\&q=85\&s=13aa9381e06edbb570b2d1567a03b091)

**Step 3**

Click **Apply preset**.

To continue without answering the questions, click **Skip**. You can choose a Review preset or change individual settings later in **Configurations**. See [Configure code review with Qodo presets](https://docs.qodo.ai/configuration/review-presets.md).

## Step 3: Get Agentic Toolbox

The [Agentic Toolbox](https://docs.qodo.ai/agentic-toolbox/agentic-toolbox-overview.md) brings Qodo's code understanding, standards, and review capabilities into your coding agent.

**Step 1**

In **Set up your team**, under **Share the install**, click **Copy message** to copy install instructions to send to your team. Each developer installs the Agentic Toolbox on their own machine.

![Onboarding wizard Get Agentic Toolbox step with the Set up your team section expanded, showing Copy message and the codebase tool access dropdown](https://mintcdn.com/qodo/LKoUOyaVY1qTFNgL/images/onboarding-wizard/onboarding-wizard-agentic-toolbox.png?fit=max\&auto=format\&n=LKoUOyaVY1qTFNgL\&q=85\&s=b19d46093583f7164136c7e6807096d4)

**Step 2**

Under **Who can use the codebase tool?**, select who in your organization has access. The codebase tool lets the Agentic Toolbox answer questions from your connected repositories. You can change this later. See [Manage access to the Agentic Toolbox](https://docs.qodo.ai/agentic-toolbox/manage-access-in-qodo-portal.md).

**Step 3**

To install the Agentic Toolbox on your own machine, expand **Install on this machine**, then copy and run the command for your operating system, **macOS / Linux** or **Windows (PowerShell)**. To connect an MCP client instead, expand the MCP client option below the command. See [Install Qodo Agentic Toolbox with the CLI](https://docs.qodo.ai/agentic-toolbox/cli.md) and [Connect Qodo Agentic Toolbox with MCP](https://docs.qodo.ai/agentic-toolbox/mcp.md).

**Step 4**

Click **Complete setup**.

## Complete setup

The final screen confirms that Qodo now reviews every new pull request in your organization. Click **Go to Home**.

## Leave and complete setup later

You can close the wizard at any step. Steps you've already completed stay saved, and background processes keep running. If you close the wizard before your Git provider connection completes, you start Connect Git from the beginning when you resume.

**Step 1**

Click **X** in the top-right corner of the wizard.

**Step 2**

In the **Leave setup?** dialog, click **Leave**. To return to the wizard instead, click **Continue setup**.

To resume, click **Complete setup** at the bottom of the left sidebar. It shows how many steps you've completed.

## Next steps

* [Set up your Qodo organization as an admin](https://docs.qodo.ai/set-up-your-qodo-organization.md): Link your Git account, connect task management, and invite your team.
* [Qodo portal quick tour](https://docs.qodo.ai/qodo-portal-quick-tour.md): Find your way around the Qodo portal.
* [Trigger a code review](https://docs.qodo.ai/code-review/use-qodo-in-prs.md): Run a review automatically or on demand.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.