//
// Simplest Possible Script Loader TM
//

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  constructor() { }

  // Remeber already loaded files so that we
  // don't load it again.
  private loadedFiles = new Set<string>();

  loadScript(src: string): Promise<void> {

    // If the file is already loaded don't do anything.
    if (this.loadedFiles.has(src)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {

      // Create a script tag and point to java script file
      const script = document.createElement('script');
      script.src = src;

      // Resolve Promise after loading
      script.onload = () => {
        this.loadedFiles.add(src);
        resolve();
      };

      // Reject Promise on error
      script.onerror = () => {
        reject();
      };

      // Add script tag to page
      document.body.appendChild(script);
    });
  }

}
