Files in **assets folder **are used to create content.

Results that can be displayed in markdown, such as in \<img> tags, are in the **images folder**.

The main README.md files will locate the content in jivs.peterblum.com/images. So any updates must be deployed there.

Use Github action "github-action-images.yml" for deployment. This is always run when pushing to the main branch.