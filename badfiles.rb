#!/usr/bin/env ruby

# Fixes a chrome bug where extensions appear "corrupted" if file sizes are a multiple of 4096

Dir['dist/**/*.*'].each do |f|
  if File.stat(f).size % 4096 == 0
    puts "Fixing #{f}"
    File.open(f, 'a') do |file|
      file.write "\n"
    end
  end
end
