{ pkgs }: {
    deps = [
      pkgs.nginx
      pkgs.mysql
      pkgs.mysql-shell
      pkgs.mysql-workbench
      pkgs.mysql80
    ];
}